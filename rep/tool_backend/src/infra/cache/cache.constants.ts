export const REDIS_SERVER = Symbol('REDIS_SERVER');

export class InboundCache<T> {
  protected cache: T;
  constructor(cache: T) {
    this.cache = cache;
  }
}

export class OutbouncCache<T> {
  protected cache: T;
  constructor(cache: T) {
    this.cache = cache;
  }
}

// codeeditor와 관련된 변수들
export const SNAPSHOT_N = 300; // snapshot을 찍는 stream 갯수들
export const STREAM_MAXLEN = 5000; // stream이 유지할수 있는 최대 길이
export const SNAPSHOT_LOCK_TTL_MS = 10_000; // 살아있는 시간이다 스냅샷을 찍는 락을 잡는다. 여러 pod에서 작업시 필요하다.

export const CACHE_NAMESPACE_NAME = Object.freeze({
  CODEEDITOR: 'cache:codeeditor',
} as const);

// codeeditor에 cache가 사용하는 namespace
export const CACHE_CODEEDITOR_NAMESPACE_NAME = Object.freeze({
  STREAM: 'stream',
  SNAPSHOT: 'snapshot',
  SNAPSHOT_LOCK: 'snapshot:lock',
} as const);

// codeeditor에서 snap_shot과 관련된 keyname
export const CACHE_CODEEDITOR_SNAPSHOT_KEY_NAME = Object.freeze({
  SNAP: 'snap', // 스냅샷 바이너리 base64 문자열로 저장된다.
  IDX: 'idx', // shapshot이 반영한 마지막 stream_id
  TX: 'tx', // snapshot이 찍힌 시간
} as const);

// stream message에 저장될 keyname
export const CACHE_CODEEDITOR_STREAM_KEY_NAME = Object.freeze({
  UPDATE: 'update',
  TX: 'tx',
  USER_ID: 'user_id',
} as const);

// base64로 인코딩 할 예정이기 때문에 이를 이용해서 정리한다.
export const encodeB64 = (u8: Uint8Array) => Buffer.from(u8).toString('base64');
export const decodeB64 = (b64: string) => Buffer.from(b64, 'base64');
