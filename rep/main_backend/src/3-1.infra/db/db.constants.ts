// db에 테이블, 열 이름을 객체화 시키는 파일

export const MYSQL_DB = Symbol('MYSQL_DB');

export const DB_TABLE_NAME = Object.freeze({
  USERS: 'Users',
  USER_PROFILES: 'User_profiles',
  OAUTH_USERS: 'Oauth_users',
  DELETE_USERS: 'Delete_users',
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
