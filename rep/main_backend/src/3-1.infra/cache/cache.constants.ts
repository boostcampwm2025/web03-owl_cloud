export const REDIS_SERVER = Symbol('REDIS_SERVER');

export const CACHE_USER_NAMESPACE_NAME = Object.freeze({
  CACHE_USER: 'cache:user', // user의 cache 정보를 이용할때 사용하는 namespace
  SESSION_USER: 'session:user', // user의 session 정보를 저장할때 사용하는 namespace
} as const);

export const CACHE_USER_SESSION_KEY_NAME = Object.freeze({
  REFRESH_TOKEN_HASH: 'refresh_token_hash',
} as const);

// 방과 관련된 cache namespace
export const CACHE_ROOM_NAMESPACE_NAME = Object.freeze({
  CACHE_ROOM : "cache:rooms"
} as const);

// 방과 함께 추가적으로 사용할 namespace ( 아래는 예시 )
// cache:rooms:${room_id}:info ?? members
// cache:rooms:sockets
export const CACHE_ROOM_SUB_NAMESPACE_NAME = Object.freeze({
  INFO : "info",
  MEMBERS : "members",
  SOCKETS : "sockets"
} as const);

// code, title, owner_id 등 방에 정보들을 저장할 key_name들
export const CACHE_ROOM_INFO_KEY_NAME = Object.freeze({
  CODE : "code",
  TITLE : "title",
  OWNER_ID : "owner_id",
  MAX_PARTICIANTS : "max_particiants",
  CURRENT_PARTICIANTS : "current_particiants",
  PASSWORD_HASH : "password_hash"
} as const);

// members는 user_id를 기반으로 저장할 예정이기 때문에 ( user_id : { props } )에 props에 들어갈 데이터이다.
export const CACHE_ROOM_MEMBERS_KEY_PROPS_NAME = Object.freeze({
  SOCKET_ID : "socket_id",
  IP : "ip",
  NICKNAME : "nickname",
} as const);

// sockets은 해당 socket_id에 대해서 room_id, user_id, ip 등을 제공해줘서 빠르게 찾을 수 있게 도와준다. ( 예시 해당 socket에 대해서 정리 )
// socket_id : { props } 에 props에 들어갈 내용
export const CACHE_ROOM_SOCKETS_KEY_PROPS_NAME = Object.freeze({
  USER_ID : "user_id",
  ROOM_ID : "room_id",
  IP : "ip"
} as const);

// sfu와 관련된 cache 정보
export const CACHE_SFU_NAMESPACE_NAME = Object.freeze({
  TRANSPORT_INFO : "cache:sfu:transports"
} as const);

export const CACHE_SFU_TRANSPORTS_KEY_NAME = Object.freeze({
  SOCKET_ID : "socket_id",
  USER_ID : "user_id",
  TYPE : "type",
  ROOM_ID : "room_id"
} as const);