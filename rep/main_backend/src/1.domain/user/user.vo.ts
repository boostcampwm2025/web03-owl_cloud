import {
  NotTypeUUidV7,
  NotTypeEmail,
  NotAllowMaxLengthText,
  NotTypeHash,
  NotAllowProviderType,
  NotAllowMimeType,
} from '@error/domain/user/user.error';
import { baseVo } from '@domain/shared';

// UserProps 타입
export type UserProps = {
  user_id: string;
  email: string;
  nickname: string;
  password_hash: string | undefined;
  created_at?: Date;
  updated_at?: Date;
};

// OauthUserProps 타입
export type OauthUserProps = {
  id: number;
  user_id: string;
  provider: string;
  provider_id: string;
  created_at?: Date;
  updated_at?: Date;
};

// UserProfile 타입
export type UserProfileProps = {
  id: number;
  user_id: string;
  profile_path: string;
  mime_type: string;
  created_at?: Date;
  updated_at?: Date;
};

// user_id의 vo 확인
export function userIdVo(user_id: UserProps['user_id']): string | never {
  const name: string = 'user_id';

  baseVo({ name, value: user_id, type: 'string' }); // null, type 체크
  user_id = user_id.trim();

  // uuid v7 체크
  const uuidV7Regxp: RegExp =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV7Regxp.test(user_id)) throw new NotTypeUUidV7(name);

  return user_id;
}

// email의 vo 확인
export function emailVo(email: UserProps['email']): string | never {
  const name: string = 'email';

  baseVo({ name, value: email, type: 'string' }); // null, type 체크
  email = email.trim();

  // email 타입 체크
  const emailRegexp: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegexp.test(email)) throw new NotTypeEmail();

  return email;
}

// nickname의 vo 확인
export function nicknameVo(nickname: UserProps['nickname']): string | never {
  const name: string = 'nickname';

  baseVo({ name, value: nickname, type: 'string' });
  nickname = nickname.trim();

  // nickname 갯수 체크
  const length: number = 16;
  if (nickname.length > length) throw new NotAllowMaxLengthText({ name, length });

  return nickname;
}

// hash의 vo 확인
const hashTypeRegXp: Array<RegExp> = [
  /^\$argon2(?:id|i|d)\$(?:v=\d+\$)?(?=[^$]*\bm=\d+\b)(?=[^$]*\bt=\d+\b)(?=[^$]*\bp=\d+\b)[^$]*\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$/,
  /^\$(2[aby])\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{22}[./A-Za-z0-9]{31}$/,
]; // 순서대로 argon2, bcrypt로 해시화가 되었는지 확인
export function passwordHashVo(
  hash: Exclude<UserProps['password_hash'], undefined>,
): string | never {
  const name: string = 'hash';

  baseVo({ name, value: hash, type: 'string' });
  hash = hash.trim();

  // hash의 타입 체크
  let checkHash: boolean = false;
  hashTypeRegXp.forEach((hashReg: RegExp): void => {
    if (hashReg.test(hash)) checkHash = true;
  });
  if (!checkHash) throw new NotTypeHash();

  return hash;
}

// provider 관련 - 여기다가 추가하면 됨 - 나중에 oauth로 쓸거
const providerTypes: Array<string> = ['kakao'];
export function providerVo(provider: OauthUserProps['provider']) {
  const name: string = 'provider';

  baseVo({ name, value: provider, type: 'string' });
  provider = provider.trim().toLowerCase();
  if (!providerTypes.includes(provider)) throw new NotAllowProviderType(providerTypes);

  return provider;
}

// provider_id 관련 - 나중에 추가 검증이 필요할 수 도 있다.
export function providerIdVo(provider_id: OauthUserProps['provider_id']) {
  const name: string = 'provider_id';

  baseVo({ name, value: provider_id, type: 'string' });
  provider_id = provider_id.trim();

  const length: number = 255;
  if (provider_id.length > length) throw new NotAllowMaxLengthText({ name, length });

  return provider_id;
}

// profile_path와 관련해서 - s3와 관련해서 추가가 필요하다.
export function profilePathVo(profile_path: UserProfileProps['profile_path']) {
  const name: string = 'profile_path';

  baseVo({ name, value: profile_path, type: 'string' });
  profile_path = profile_path.trim();

  const length: number = 255;
  if (profile_path.length > length) throw new NotAllowMaxLengthText({ name, length });

  return profile_path;
}

// mime_type와 관련해서
const mimeTypeList: Array<string> = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
]; // 가능한 mime type들
export function mimeTypeVo(mime_type: UserProfileProps['mime_type']) {
  const name: string = 'mime_type';

  baseVo({ name, value: mime_type, type: 'string' });
  mime_type = mime_type.trim().toLowerCase();

  if (!mimeTypeList.includes(mime_type)) throw new NotAllowMimeType(mimeTypeList);

  return mime_type;
}
