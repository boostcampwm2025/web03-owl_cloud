import { GuardService } from '@/guards/guard.service';
import { ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Injectable } from '@nestjs/common';
import { CODEEDITOR_GROUP } from './codeeditor.constants';
import { encodeUpdate, REDIS_SERVER, streamKey } from '@/infra/cache/cache.constants';
import type { RedisClientType } from 'redis';
import { Socket } from 'socket.io';
import { CodeeditorRepository, YjsRoomResult } from '@/infra/memory/tool';


@Injectable()
export class CodeeditorService {
  constructor(
    private readonly guard: GuardService,
    @Inject(REDIS_SERVER) private readonly redis : RedisClientType<any, any>, // redis를 사용하기 위한 부분
    private readonly codeeditorRepo : CodeeditorRepository,
  ) {}

  async guardService(token: string, type: 'main' | 'sub'): Promise<ToolBackendPayload> {
    const verified = await this.guard.verify(token);

    const payload: ToolBackendPayload = {
      room_id: verified.room_id,
      user_id: verified.sub,
      tool: verified.tool,
      socket_id: verified.socket_id,
      ticket: verified.ticket,
      clientType: type,
      nickname: verified.nickname,
    };

    if (payload.tool !== 'codeeditor') throw new Error('codeeditor만 가능한 gateway입니다.');

    return payload;
  }

  // 이 함수로 가입을하고 여기로 브로드캐스팅을 진행합니다.
  makeNamespace(room_id: string): string {
    return `${CODEEDITOR_GROUP.CODEEDITOR}:${room_id}`;
  }

  // redis에 스트림을 처리 
  async appendUpdateLog(args : {
    room_id : string;
    prevIdx: string;
    update: Buffer;
    user_id : string;
  }) {
    // redis에 저장할 키 이름
    const key = streamKey(args.room_id);

    const updateIdx = await this.redis.xAdd(
      key,
      '*', // 자동으로 생성
      {
        prev_idx: args.prevIdx,
        update: encodeUpdate(args.update),
        ts: Date.now().toString(),
        ...(args.user_id ? { user_id: args.user_id } : {}),
      },
      {
        // 메모리 보호: 대충 5000개 유지 (필요에 맞게)
        TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 5000 },
      },
    );

    return { updateIdx };
  };

  // 마지막 stream id를 가져온다.
  async getLastUpdateIdx(roomId: string): Promise<string> {
    const key = streamKey(roomId);
    const rows = await this.redis.xRevRange(key, '+', '-', { COUNT: 1 }); // +는 가장 최신 부터 -는 가장 오래된 id까지 한개만 가져온다.
    if (rows.length === 0) return '0-0';
    return rows[0].id;
  };

  // client에 idx부터 로그를 쭉 가져온다. 
  async pullUpdatesAfter(roomId: string, fromIdx: string): Promise<Array<{ id: string; update: Buffer; prevIdx?: string }>> {
    const key = streamKey(roomId);

    // fromIdx "미포함" 범위: (fromIdx
    const start = `(${fromIdx}`;
    const rows = await this.redis.xRange(key, start, '+');

    // 현재 이후에 idx를 전체적으로 반납한다. 
    return rows.map((r) => {
      const raw = r.message.update;

      if (typeof raw !== 'string') {
        throw new Error('Invalid update type: expected base64 string');
      }

      return {
        id: r.id,
        update: Buffer.from(raw, 'base64'),
        prevIdx: typeof r.message.prev_idx === 'string'
          ? r.message.prev_idx
          : undefined,
      };
    });
  };

  async catchUpForm(client: Socket, fromIdx: string) {

    // socket 정보
    const payload: ToolBackendPayload = client.data.payload;
    const roomName: string = client.data.roomName;

    if (!payload?.room_id || !roomName) return;

    // 서버에 가장 최신 idx 가져오기 
    const entry = this.codeeditorRepo.ensure(roomName);
    const serverIdx = entry.idx;

    // 최신이면 스킵 ( 아마 초창기에는 그럴수 있다.  )
    if (fromIdx === serverIdx) {
      client.emit('yjs-catchup', { ok: true, from: fromIdx, to: serverIdx, updates: [] });
      client.data.last_idx = serverIdx;
      return;
    };

    // 잃어버린걸 pull한다. 
    const missing = await this.pullUpdatesAfter(payload.room_id, fromIdx);
    if (missing.length === 0 && fromIdx !== serverIdx) {
      client.emit('yjs-resync-required', { server_idx: serverIdx });
      return;
    };

    // 한번에 보낸다. 
    client.emit('yjs-catchup', {
      ok: true,
      from: fromIdx,
      to: missing[missing.length - 1].id,
      updates: missing.map((m) => ({
        prev_idx: m.prevIdx ?? undefined,
        update_idx: m.id,
        update: m.update,
      })),
    });

    client.data.last_idx = missing[missing.length - 1].id;
  };

}
