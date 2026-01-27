import { GuardService } from '@/guards/guard.service';
import { ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Injectable } from '@nestjs/common';
import { CODEEDITOR_GROUP } from './codeeditor.constants';
import { CACHE_CODEEDITOR_NAMESPACE_NAME, CACHE_NAMESPACE_NAME, REDIS_SERVER } from '@/infra/cache/cache.constants';
import type { RedisClientType } from 'redis';
import { CodeeditorRepository, YjsUpdateClientPayload } from '@/infra/memory/tool';


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

  // buffer가 ydocs가 허용하는 buffer인지 검증
  normalizeToBuffer(value: unknown): Buffer | null {
    if (!value) return null;
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
    return null;
  }
  normalizeToBuffers(payload: YjsUpdateClientPayload): Buffer[] | null {
    // 검증을 위한 buf
    const toBuf = (v: any): Buffer | null => {
      if (!v) return null;
      if (Buffer.isBuffer(v)) return v;
      if (v instanceof Uint8Array) return Buffer.from(v);
      if (v instanceof ArrayBuffer) return Buffer.from(new Uint8Array(v));
      return null;
    };

    // updates 우선
    if (payload.updates !== undefined) {
      if (!Array.isArray(payload.updates)) return null;
      const bufs: Buffer[] = [];
      for (const item of payload.updates as any[]) {
        const b = toBuf(item);
        if (!b) return null;
        bufs.push(b);
      }
      return bufs;
    }

    // 다음은 update
    if (payload.update !== undefined) {
      const b = toBuf(payload.update);
      return b ? [b] : null;
    }

    return null; // 둘 다 없음
  }

  // redis 스트림으로 처리
  // stream 쌓는법 
  // key이름 생성법 
  private streamKey(room_id : string) : string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.STREAM}`;
  };
  private snapshotKey(room_id : string) : string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.SNAPSHOT}`;
  };
  private snapshotLockKey(room_id : string) : string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.SNAPSHOT_LOCK}`;
  };

  

}
