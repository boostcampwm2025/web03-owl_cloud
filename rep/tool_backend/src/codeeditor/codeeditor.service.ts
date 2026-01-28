import { GuardService } from '@/guards/guard.service';
import { ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CODEEDITOR_GROUP } from './codeeditor.constants';
import {
  CACHE_CODEEDITOR_NAMESPACE_NAME,
  CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME,
  CACHE_CODEEDITOR_STREAM_KEY_NAME,
  CACHE_NAMESPACE_NAME,
  decodeB64,
  encodeB64,
  REDIS_SERVER,
  SNAPSHOT_N,
  STREAM_MAXLEN,
} from '@/infra/cache/cache.constants';
import type { RedisClientType } from 'redis';
import { CodeeditorRepository, UpdateEntry, YjsUpdateClientPayload } from '@/infra/memory/tool';

@Injectable()
export class CodeeditorService {
  private logger = new Logger(CodeeditorService.name);

  constructor(
    private readonly guard: GuardService,
    @Inject(REDIS_SERVER) private readonly redis: RedisClientType<any, any>, // redis를 사용하기 위한 부분
    private readonly codeeditorRepo: CodeeditorRepository,
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
  private streamKey(room_id: string): string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.STREAM}`;
  }
  private snapshotKey(room_id: string): string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.SNAPSHOT}`;
  }
  private snapshotLockKey(room_id: string): string {
    return `${CACHE_NAMESPACE_NAME.CODEEDITOR}:${room_id}:${CACHE_CODEEDITOR_NAMESPACE_NAME.SNAPSHOT_LOCK}`;
  }

  // redis로 부터 docs를 가져오는 로직 ( 메모리에 없을 경우 cache에서 불러와서 저장한다. )
  async ensureDocFromRedis(room_id: string): Promise<UpdateEntry> {
    const existed = this.codeeditorRepo.get(room_id);
    if (existed) return this.codeeditorRepo.encodeFull(room_id);

    // 없으면 생성한다. ( cache에서 채울 예정 )
    this.codeeditorRepo.ensure(room_id);

    const snapKey: string = this.snapshotKey(room_id);
    const snap = await this.redis.hGetAll(snapKey); // 현재 snap shot을 가져온다.

    let snapshotIdx: string = '0-0'; // 초기 스트림 아이디
    const snapStr: string | null = snap[CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.SNAP];
    const idx: string | null = snap[CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.IDX];
    if (snap && snapStr && idx) {
      const snapBuf = decodeB64(snapStr);
      // 위에서 새로운 codeeditor을 업데이트 했음으로 데이터를 업데이트 해준다. ( 없을 경우에는 그냥 docs로 가게 된다. )
      this.codeeditorRepo.applySnapshot(room_id, new Uint8Array(snapBuf));
      snapshotIdx = idx; // 가장 마지막으로 업데이트
    }

    // snapshot 이후 stream을 다시 replay 한다.
    const stremkey: string = this.streamKey(room_id);
    const rows = await this.redis.xRange(stremkey, snapshotIdx, '+'); // 그 IDX 이후에 데이터가 있는지 확인

    for (const row of rows) {
      if (snapshotIdx !== '0-0' && row.id === snapshotIdx) continue;
      const uB64 = row.message[CACHE_CODEEDITOR_STREAM_KEY_NAME.UPDATE] as string | undefined;
      if (!uB64) continue;
      const uBuf = decodeB64(uB64);
      this.codeeditorRepo.applyAndAppendUpdate(room_id, new Uint8Array(uBuf));
    }

    // 마지막 stream 까지 업데이트 시킨다.
    return this.codeeditorRepo.encodeFull(room_id);
  }

  // stream update
  async appendUpdatesToStream(room_id: string, updates: Uint8Array[], user_id: string) {
    const streamKey: string = this.streamKey(room_id);
    let lastId: string = '0-0';

    for (const u of updates) {
      lastId = await this.redis.xAdd(streamKey, '*', {
        [CACHE_CODEEDITOR_STREAM_KEY_NAME.UPDATE]: encodeB64(u),
        [CACHE_CODEEDITOR_STREAM_KEY_NAME.TX]: String(Date.now()),
        [CACHE_CODEEDITOR_STREAM_KEY_NAME.USER_ID]: user_id,
      });
    }

    return lastId;
  }

  // stream 300 마다 snapshot 작성
  async maybeSnapShot(room_id: string) {
    const state = this.codeeditorRepo.ensure(room_id);
    if (state.seq % SNAPSHOT_N !== 0) return; // 현재 stream이 정한 갯수 만큼 찍혔다면 업데이트한다.

    // 추후 여러 pod 대비 lock을 추가해야 한다. ( 지금은 스킵 )

    try {
      const snapU8 = this.codeeditorRepo.encodeSnapshot(room_id); // snapshot을 만든다. ( 성능 병목 현상이 뜨는 장소 )
      const snapB64 = encodeB64(snapU8);
      const ts = String(Date.now());

      const streamKey = this.streamKey(room_id);
      const latest = await this.redis.xRevRange(streamKey, '+', '-', { COUNT: 1 });
      const idx = latest.length ? latest[0].id : '0-0';

      const snapKey = this.snapshotKey(room_id);
      const tx = this.redis.multi();

      tx.hSet(snapKey, {
        [CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.SNAP]: snapB64,
        [CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.IDX]: idx,
        [CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME.TX]: ts,
      });

      tx.xTrim(streamKey, 'MAXLEN', STREAM_MAXLEN, { strategyModifier: '~' }); // 원자성 보장

      const res = await tx.exec();
      if (!res) return;
    } catch (err) {
      this.logger.error(err);
    }
  }
}
