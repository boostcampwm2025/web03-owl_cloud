export const REDIS_SERVER = Symbol('REDIS_SERVER');

export const CACHE_USER_NAMESPACE_NAME = Object.freeze({
  CACHE_USER: 'cache:user', // user의 cache 정보를 이용할때 사용하는 namespace
  SESSION_USER: 'session:user', // user의 session 정보를 저장할때 사용하는 namespace
} as const);

export const CACHE_USER_SESSION_KEY_NAME = Object.freeze({
  REFRESH_TOKEN_HASH: 'refresh_token_hash',
} as const);

// card와 관련된 namespace
export const CACHE_CARD_NAMESPACE_NAME = Object.freeze({
  CACHE_CARD_ITEM_ASSET : "cache:card:item_asset" // card와 관련된 namespace 중에서 item_asset만
} as const);

export const CACHE_CARD_ITEM_ASSET_KEY_NAME = Object.freeze({
  CARD_ID : "card_id",
  ITEM_ID : "item_id",
  KEY_NAME : "key_name",
  MIME_TYPE : "mime_type",
  SIZE : "size", 
  STATUS : "status",
  UPLOAD_ID : "upload_id"
} as const);