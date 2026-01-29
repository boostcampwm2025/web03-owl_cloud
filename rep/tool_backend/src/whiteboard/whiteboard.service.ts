import { GuardService } from '@/guards/guard.service';
import { ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WHITEBOARD_GROUP } from './whiteboard.constants';
import {
  CACHE_NAMESPACE_NAME,
  CACHE_WHITEBOARD_NAMESPACE_NAME,
  CACHE_WHITEBOARD_SNAPSHOT_KEY_NAME,
  CACHE_WHITEBOARD_STREAM_KEY_NAME,
  decodeB64,
  encodeB64,
  REDIS_SERVER,
  SNAPSHOT_N,
  STREAM_MAXLEN,
  WHITEBOARD_BATCH_MAX_UPDATES,
  WHITEBOARD_BATCH_WINDOW_MS,
  WHITEBOARD_SNAPSHOT_EVERY_MS,
  WHITEBOARD_SNAPSHOT_MIN_SEQ_DELTA,
  WHITEBOARD_STREAM_MAXLEN,
} from '@/infra/cache/cache.constants';
import type { RedisClientType } from 'redis';
import {
  Pending,
  PendingRepository,
  SnapState,
  SnapStateRepository,
  UpdateEntry,
  WhiteboardRepository,
  YjsUpdateClientPayload,
} from '@/infra/memory/tool';
import * as Y from 'yjs';

@Injectable()
export class WhiteboardService {
  private logger = new Logger(WhiteboardService.name);
  // whiteboar에서 buffer가 쌓일때 처리할 pendin

  constructor(
    private readonly guard: GuardService,
    @Inject(REDIS_SERVER) private readonly redis: RedisClientType<any, any>,
    private readonly whiteboardRepo: WhiteboardRepository,
    private readonly pending: PendingRepository,
    private readonly snapState: SnapStateRepository,
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

    if (payload.tool !== 'whiteboard') throw new Error('whiteboard만 가능한 gateway입니다.');

    // main인 경우 emit 해준다.

    return payload;
  }

  makeNamespace(room_id: string): string {
    return `${WHITEBOARD_GROUP.WHITEBOARD}:${room_id}`;
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
    return `${CACHE_NAMESPACE_NAME.WHITEBOARD}:${room_id}:${CACHE_WHITEBOARD_NAMESPACE_NAME.STREAM}`;
  }
  private snapshotKey(room_id: string): string {
    return `${CACHE_NAMESPACE_NAME.WHITEBOARD}:${room_id}:${CACHE_WHITEBOARD_NAMESPACE_NAME.SNAPSHOT}`;
  }

  // stream으로 쌓아서 처리하는 것이 좀 더 유리하기 때문에
  // flush는 정리하는 함수이고
  private async flushRoom(room_id: string) {
    const p = this.pending.get(room_id);
    if (!p) return;

    if (p.timer) {
      clearTimeout(p.timer); // 시간이 걸려있다면 잠시 아웃
      p.timer = undefined;
    }

    try {
      // merge + xAdd 1번
      await this.appendUpdatesToStream(room_id, p.updates, p.user_id);
      this.pending.delete(room_id);

      // snapshot도 적용
      await this.maybeSnapShot(room_id);
    } catch (err) {
      // 레디스에 저장을 한경우만 정리하도록 로직을 정리하였다.
      this.logger.error(err);
    }
  }

  // 아래는 queue에 쌓는 함수 ( whiteboard에경우 서버 자체이서도 데이터를 쌓아서 처리하는게 유리할 tn )
  queueUpdates(room_id: string, updates: Uint8Array[], user_id: string) {
    if (!updates.length) return;

    const p = this.pending.get(room_id) ?? { updates: [], user_id };
    p.updates.push(...updates);
    p.user_id = user_id;
    this.pending.set(room_id, p);

    // 너무 많이 쌓이면 즉시 flush ( snapshot이랑 merge도 같이 처리해준다. )
    if (p.updates.length >= WHITEBOARD_BATCH_MAX_UPDATES) {
      void this.flushRoom(room_id);
      return;
    }

    // 타이머 추가
    if (!p.timer) {
      p.timer = setTimeout(() => void this.flushRoom(room_id), WHITEBOARD_BATCH_WINDOW_MS);
    }
  }

  // redis로 부터 docs를 가져오는 로직 ( 메모리에 없을 경우 cache에서 불러와서 저장한다. )
  async ensureDocFromRedis(room_id: string): Promise<UpdateEntry> {
    const existed = this.whiteboardRepo.get(room_id);
    if (existed) return this.whiteboardRepo.encodeFull(room_id);

    // 없으면 생성한다. ( cache에서 채울 예정 )
    this.whiteboardRepo.ensure(room_id);

    const snapKey: string = this.snapshotKey(room_id);
    const snap = await this.redis.hGetAll(snapKey); // 현재 snap shot을 가져온다.

    let snapshotIdx: string = '0-0'; // 초기 스트림 아이디
    const snapStr: string | null = snap[CACHE_WHITEBOARD_SNAPSHOT_KEY_NAME.SNAP];
    const idx: string | null = snap[CACHE_WHITEBOARD_SNAPSHOT_KEY_NAME.IDX];
    if (snap && snapStr && idx) {
      const snapBuf = decodeB64(snapStr);
      // 위에서 새로운 codeeditor을 업데이트 했음으로 데이터를 업데이트 해준다. ( 없을 경우에는 그냥 docs로 가게 된다. )
      this.whiteboardRepo.applySnapshot(room_id, new Uint8Array(snapBuf));
      snapshotIdx = idx; // 가장 마지막으로 업데이트
    }

    // snapshot 이후 stream을 다시 replay 한다.
    const stremkey: string = this.streamKey(room_id);
    const rows = await this.redis.xRange(stremkey, snapshotIdx, '+'); // 그 IDX 이후에 데이터가 있는지 확인

    for (const row of rows) {
      if (snapshotIdx !== '0-0' && row.id === snapshotIdx) continue;
      const uB64 = row.message[CACHE_WHITEBOARD_STREAM_KEY_NAME.UPDATE] as string | undefined;
      if (!uB64) continue;
      const uBuf = decodeB64(uB64);
      this.whiteboardRepo.applyAndAppendUpdate(room_id, new Uint8Array(uBuf));
    }

    // 마지막 stream 까지 업데이트 시킨다.
    return this.whiteboardRepo.encodeFull(room_id);
  }

  // stream update
  async appendUpdatesToStream(room_id: string, updates: Uint8Array[], user_id: string) {
    const streamKey: string = this.streamKey(room_id);
    if (!updates.length) return '0-0';

    // 기존 codeeditor와는 다르게 한번에 merge해서 처리해준다.
    const merged = updates.length === 1 ? updates[0] : Y.mergeUpdates(updates);

    const lastId = await this.redis.xAdd(streamKey, '*', {
      [CACHE_WHITEBOARD_STREAM_KEY_NAME.UPDATE]: encodeB64(merged),
      [CACHE_WHITEBOARD_STREAM_KEY_NAME.TX]: String(Date.now()),
      [CACHE_WHITEBOARD_STREAM_KEY_NAME.USER_ID]: user_id,
    });

    return lastId;
  }

  // stream 300 마다 snapshot 작성
  async maybeSnapShot(room_id: string) {
    const entry = this.whiteboardRepo.ensure(room_id);

    // whiteboard는 시간 or 데이터가 일정수준일때 snapshot을 찍어야 하기때문에 아래와 같이 처리한다.
    const now = Date.now();
    const st = this.snapState.get(room_id) ?? { lastTs: 0, lastSeq: 0 };
    if (!this.snapState.get(room_id)) this.snapState.set(room_id, st);

    // 하나라도 충족하면 snapshot을 찍습니다.
    const enoughTime = now - st.lastTs >= WHITEBOARD_SNAPSHOT_EVERY_MS;
    const enoughUpdates = entry.seq - st.lastSeq >= WHITEBOARD_SNAPSHOT_MIN_SEQ_DELTA;

    if (!enoughTime || !enoughUpdates) return;

    // 추후 여러 pod 대비 lock을 추가해야 한다. ( 지금은 스킵 )
    try {
      const snapU8 = this.whiteboardRepo.encodeSnapshot(room_id); // snapshot을 만든다. ( 성능 병목 현상이 뜨는 장소 )
      const snapB64 = encodeB64(snapU8);

      const streamKey = this.streamKey(room_id);
      const latest = await this.redis.xRevRange(streamKey, '+', '-', { COUNT: 1 });
      const idx = latest.length ? latest[0].id : '0-0';

      const snapKey = this.snapshotKey(room_id);
      const tx = this.redis.multi();

      tx.hSet(snapKey, {
        [CACHE_WHITEBOARD_SNAPSHOT_KEY_NAME.SNAP]: snapB64,
        [CACHE_WHITEBOARD_SNAPSHOT_KEY_NAME.IDX]: idx,
        [CACHE_WHITEBOARD_SNAPSHOT_KEY_NAME.TX]: String(now),
      });

      tx.xTrim(streamKey, 'MAXLEN', WHITEBOARD_STREAM_MAXLEN, { strategyModifier: '~' }); // 원자성 보장

      const res = await tx.exec();
      if (!res) return;

      // snapshot 저장에 성공하면 상태를 갱신한다.
      this.snapState.set(room_id, { lastTs: now, lastSeq: entry.seq });

      // 스냅샷 시기를 초기화 한다.
      this.whiteboardRepo.markSnapshot(room_id, entry.seq);
    } catch (err) {
      this.logger.error(err);
    }
  }
}
