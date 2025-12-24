// db에 테이블, 열 이름을 객체화 시키는 파일

export const MYSQL_DB = Symbol('MYSQL_DB');

export const DB_TABLE_NAME = Object.freeze({
  USERS: 'Users',
  USER_PROFILES: 'User_profiles',
  OAUTH_USERS: 'Oauth_users',
  DELETE_USERS: 'Delete_users',
  USER_FOLLOWS : "User_follows",
  CARDS : "Cards",
  CARD_ITEMS : "Card_items",
  CARD_STATS : "Card_stats",
  CATEGORIES : "Categories",
  CARD_LIKES : "Card_likes",
  CARD_ITEM_ASSETS : "Card_item_assets"
} as const);

// 기본 테이블 이름에 쓰이는거
const DB_BASE_ATTRIBTE_NAME = Object.freeze({
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const);

export const DB_USERS_ATTRIBUTE_NAME = Object.freeze({
  USER_ID: 'user_id',
  EMAIL: 'email',
  NICKNAME: 'nickname',
  PASSWORD_HASH: 'password_hash',
  ...DB_BASE_ATTRIBTE_NAME,
} as const);

// 유저 테이블과 연관되 경우 이걸 기본으로 사용
export const DB_USER_BASES_ATTRIBUTE_NAME = Object.freeze({
  ID: 'id',
  USER_ID: 'user_id',
} as const);

export const DB_USER_PROFILES_ATTRIBUTE_NAME = Object.freeze({
  ...DB_USER_BASES_ATTRIBUTE_NAME,
  PROFILE_PATH: 'profile_path',
  MIME_TYPE: 'mime_type',
  ...DB_BASE_ATTRIBTE_NAME,
} as const);

export const DB_OAUTH_USERS_ATTRIBUTE_NAME = Object.freeze({
  ...DB_USER_BASES_ATTRIBUTE_NAME,
  PROVIDER: 'provider',
  PROVIDER_ID: 'provider_id',
  ...DB_BASE_ATTRIBTE_NAME,
} as const);

export const DB_DELETE_USERS_ATTRIBUTE_NAME = Object.freeze({
  ...DB_USER_BASES_ATTRIBUTE_NAME,
  EMAIL: 'email',
  ...DB_BASE_ATTRIBTE_NAME,
} as const);

export const DB_USER_FOLLOWS_ATTRIBUTE_NAME = Object.freeze({
  ID : "id",
  FOLLOWER_ID : "follower_id",
  FOLLOWING_ID : "following_id",
  CREATED_AT : 'created_at',
} as const);

export const DB_CARDS_ATTRIBUTE_NAME = Object.freeze({
  CARD_ID : "card_id",
  USER_ID : "user_id",
  CATEGORY_ID : "category_id",
  THUMBNAIL_PATH : "thumbnail_path",
  STATUS : "status",
  TITLE : "title",
  WORKSPACE_WIDTH : "workspace_width",
  WORKSPACE_HEIGHT : "workspace_height",
  BACKGROUND_COLOR : "background_color",
  DELETED_AT : "deleted_at",
  ...DB_BASE_ATTRIBTE_NAME
} as const);

export const DB_CARD_ITEMS_ATTRIBUTE_NAME = Object.freeze({
  ITEM_ID : "item_id",
  CARD_ID : "card_id",
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
  DELETED_AT : "deleted_at",
  ...DB_BASE_ATTRIBTE_NAME
} as const);

const DB_CARD_BASE_ATTRIBUTE_NAME = Object.freeze({
  ID : "id",
  CARD_ID : "card_id",
} as const);

export const DB_CARD_STATS_ATTRIBUTE_NAME = Object.freeze({
  ...DB_CARD_BASE_ATTRIBUTE_NAME,
  LIKE_COUNT : "like_count",
  VIEW_COUNT : "view_count",
  ...DB_BASE_ATTRIBTE_NAME
} as const);

export const DB_CATEGORIES_ATTRIBUTE_NAME = Object.freeze({
  ID : "id",
  NAME : "name",
  ...DB_BASE_ATTRIBTE_NAME  
} as const);

export const DB_CARD_LIKES_ATTRIBUTE_NAME = Object.freeze({
  ...DB_CARD_BASE_ATTRIBUTE_NAME,
  USER_ID : "user_id",
  CREATED_AT : 'created_at',
} as const);

export const DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME = Object.freeze({
  ITEM_ID : "item_id",
  KEY_NAME : "key_name",
  MIME_TYPE : "mime_type",
  SIZE : "size", 
  STATUS : "status",
  CARD_ID : "card_id",
  ...DB_BASE_ATTRIBTE_NAME
} as const);