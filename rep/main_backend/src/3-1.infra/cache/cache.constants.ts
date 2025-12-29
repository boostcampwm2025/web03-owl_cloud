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
  CACHE_CARD : "cache:card",
  CACHE_CARD_ITEM : "cache:card:item", // card_item과 관련해서 저장
  CACHE_CARD_ITEM_ASSET : "cache:card:item_asset", // card와 관련된 namespace 중에서 item_asset만
} as const);

// card와 관련된 namespace
export const CACHE_CARD_KEY_NAME = Object.freeze({
  CARD_ID : "card_id",
  USER_ID : "user_id",
  STATUS : "status",
  CATEGORY_ID : "category_id",
  THUMBNAIL_PATH : "thumbnail_path",
  TITLE : "title",
  WORKSPACE_WIDTH : "workspace_width",
  WORKSPACE_HEIGHT : "workspace_height",
  BACKGROUND_COLOR : "background_color",
  LIKE_COUNT : "like_count",
  VIEW_COUNT : "view_count"
} as const);

// card_item과 관련된 key_name
export const CACHE_CARD_ITEM_KEY_NAME = Object.freeze({
  CARD_ID : "card_id",
  ITEM_ID : "item_id",
  TYPE : "type",
  X : "x",
  Y : "y",
  WIDTH : "width",
  HEIGHT : "height",
  ROTATION : "rotation",
  SCALE_X : "scale_x",
  SCALE_Y : "scale_y",
  OPACITY : "opacity",
  Z_INDEX : "z_index",
  IS_LOCKED : "is_locked",
  IS_VISIBLE : "is_visible",
  NAME : "name",
  OPTION: "option",
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