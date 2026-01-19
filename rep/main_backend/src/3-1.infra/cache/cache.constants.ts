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
  CACHE_ROOM: 'cache:rooms',
} as const);

// 방과 함께 추가적으로 사용할 namespace ( 아래는 예시 )
// cache:rooms:${room_id}:info ?? members
// cache:rooms:sockets
export const CACHE_ROOM_SUB_NAMESPACE_NAME = Object.freeze({
  INFO: 'info',
  MEMBERS: 'members',
  SOCKETS: 'sockets',
} as const);

// code, title, owner_id 등 방에 정보들을 저장할 key_name들
export const CACHE_ROOM_INFO_KEY_NAME = Object.freeze({
  CODE: 'code',
  TITLE: 'title',
  OWNER_ID: 'owner_id',
  MAX_PARTICIANTS: 'max_particiants',
  CURRENT_PARTICIANTS: 'current_particiants',
  PASSWORD_HASH: 'password_hash',
  TOOL_TICKET: 'tool_ticket', // 현재 저장된 tool_ticket ( tool 상태를 만들기 전에 존재 )
  MAIN_PRODUCER: 'main_producer', // 현재 방에서 가장 메인이 되는 produce가 뭔지
  SUB_PRODUCER: 'sub_producer', // main_produce를 도와주는 sub_produce가 뭔지 -> audio 같은것이 위치할 예정
} as const);

// produce에 저장되는 정보들 room_id 기반이다.
export const CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME = Object.freeze({
  PRODUCER_ID: 'producer_id',
  TYPE: 'type',
  KIND: 'kind',
  USER_ID: 'user_id',
  TOOL: 'tool',
} as const);

// members는 user_id를 기반으로 저장할 예정이기 때문에 ( user_id : { props } )에 props에 들어갈 데이터이다.
export const CACHE_ROOM_MEMBERS_KEY_PROPS_NAME = Object.freeze({
  SOCKET_ID: 'socket_id',
  IP: 'ip',
  NICKNAME: 'nickname',
  IS_GUEST: 'is_guest',
} as const);

// sockets은 해당 socket_id에 대해서 room_id, user_id, ip 등을 제공해줘서 빠르게 찾을 수 있게 도와준다. ( 예시 해당 socket에 대해서 정리 )
// socket_id : { props } 에 props에 들어갈 내용
export const CACHE_ROOM_SOCKETS_KEY_PROPS_NAME = Object.freeze({
  USER_ID: 'user_id',
  ROOM_ID: 'room_id',
  IP: 'ip',
} as const);

// sfu와 관련된 cache 정보
export const CACHE_SFU_NAMESPACE_NAME = Object.freeze({
  USER_INFO: 'cache:sfu:users', // + user_id -> 유저에 따라서 필요한 정보 저장
  TRANSPORT_INFO: 'cache:sfu:transports', // + transport_id
  PRODUCER_INFO: 'cache:sfu:producers', // + room_id:user_id -> 해당 user는 audio, video를 하나만 등록할수 있어야 하기 때문에
  CONSUMER_INFO: 'cache:sfu:consumers', // + room_id:user_id
} as const);

// sfu에 유저정보 관련
export const CACHE_SFU_USER_KEY_NAME = Object.freeze({
  SEND_TRANSPORT_ID: 'send_transport_id',
  RECV_TRANSPORT_ID: 'recv_transport_id',
});

export const CACHE_SFU_TRANSPORTS_KEY_NAME = Object.freeze({
  SOCKET_ID: 'socket_id',
  USER_ID: 'user_id',
  TYPE: 'type',
  ROOM_ID: 'room_id',
} as const);

// producer에 사실상 key_name
export const CACHE_SFU_PRODUCERS_KEY_NAME = Object.freeze({
  AUDIO: 'audio',
  VIDEO: 'video',
});

// produce에 key(audio, video)에 저장되는 정보 -> room_id:user_id 필요 ( 이유 -> 해당 room에 user 정보가 같이 들어감으로 -> 모든 데이터를 가져와야 한다. )
export const CACHE_SFU_PRODUCES_KEY_PROPS_NAME = Object.freeze({
  PRODUCER_ID: 'producer_id',
  TYPE: 'type',
  KIND: 'kind',
} as const);

// consumer는 여러개를 사용할 수 있음 consumer_id : { 아래 데이터들 }
export const CACHE_SFU_CONSUMER_KEY_PROPS_NAME = Object.freeze({
  CONSUMER_ID: 'consumer_id',
  PRODUCER_ID: 'producer_id',
  USER_ID: 'user_id',
  STATUS: 'status',
  TRANSPORT_ID: 'transport_id',
});
