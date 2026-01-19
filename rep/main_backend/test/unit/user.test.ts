import { OauthUser, User, UserProfile } from '@domain/user/entities';

describe('domain 레이어에 유저 entity 관련 단위테스트', () => {
  // 정합성에 사용될 데이터의 타입
  type TestCase1Props = {
    user_id: string | undefined;
    email: string | undefined;
    nickname: string | undefined;
    password_hash: string | undefined;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    ok: boolean;
  };

  const now = new Date();
  const TestCase1: Array<TestCase1Props> = [
    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      user_id: '       018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0       ',
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      user_id: undefined,
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      user_id: 'uuid',
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: '     naxtto@naver.com      ',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: undefined,
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash:
        '       $argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8     ',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash: undefined,
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash: 'password',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash: '$2b$10$C6UzMDM.H6dfI/f/IKcEeOQyZ9k4PpZp3YfL2y0w9nQzFz0QFz3e6',
      nickname: '완두콩',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: Array(16).fill('닉').join(''),
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: Array(17).fill('닉').join(''),
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      email: 'naxtto@naver.com',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      nickname: undefined,
      created_at: now,
      updated_at: now,
      ok: false,
    },
  ];

  test.each(TestCase1)(
    'user entity에 정합성을 파악하는 단위테스트',
    ({ user_id, email, password_hash, nickname, created_at, updated_at, ok }) => {
      const test1 = () => {
        user_id = user_id as string;
        email = email as string;
        nickname = nickname as string;
        return new User({
          user_id,
          email,
          password_hash,
          nickname,
          created_at,
          updated_at,
        });
      };
      if (ok) {
        const t1 = test1();
        expect(t1.getUserId()).toBe(user_id?.trim());
        expect(t1.getEmail()).toBe(email?.trim());
        expect(t1.getNickName()).toBe(nickname?.trim());
        expect(t1.getPasswordHash()).toBe(password_hash?.trim());
      } else expect(test1).toThrow();
    },
  );

  // oauth 정합성 테스트에 사용할 데이터
  type TestCase2Props = {
    id: number | undefined;
    user_id: string | undefined;
    provider: string | undefined;
    provider_id: string | undefined;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    ok: boolean;
  };

  const TestCase2: Array<TestCase2Props> = [
    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'kakao',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 0,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'kakao',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: -1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'kakao',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: undefined,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'kakao',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      provider: 'kakao',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: undefined,
      provider: 'kakao',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '     018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0    ',
      provider: 'kakao',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: '    kakao    ',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'KAKAo',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: undefined,
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'other',
      provider_id: 'a1231231231',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'kakao',
      provider_id: undefined,
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'kakao',
      provider_id: Array(255).fill('p').join(''),
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      provider: 'kakao',
      provider_id: Array(256).fill('p').join(''),
      created_at: now,
      updated_at: now,
      ok: false,
    },
  ];

  test.each(TestCase2)(
    'oauth entity에 정합성을 파악하는 단위테스트',
    ({ id, user_id, provider, provider_id, created_at, updated_at, ok }) => {
      const test2 = () => {
        id = id as number;
        user_id = user_id as string;
        provider = provider as string;
        provider_id = provider_id as string;

        return new OauthUser({
          id,
          user_id,
          provider,
          provider_id,
          created_at,
          updated_at,
        });
      };

      if (ok) {
        const t2 = test2();
        expect(t2.getId()).toBe(id);
        expect(t2.getUserId()).toBe(user_id?.trim());
        expect(t2.getProvider()).toBe(provider?.trim().toLowerCase());
        expect(t2.getProviderId()).toBe(provider_id?.trim());
      } else expect(test2).toThrow();
    },
  );

  type TestCase3Props = {
    id: number | undefined;
    user_id: string | undefined;
    profile_path: string | undefined;
    mime_type: string | undefined;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    ok: boolean;
  };

  const TestCase3: Array<TestCase3Props> = [
    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 0,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: -1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: undefined,
      profile_path: 'profile.png',
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '       018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0       ',
      profile_path: 'profile.png',
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      profile_path: 'profile.png',
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: undefined,
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: '      profile.png    ',
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: Array(255).fill('p').join(''),
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: Array(256).fill('p').join(''),
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: undefined,
      created_at: now,
      updated_at: now,
      ok: false,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: '      image/png     ',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: 'image/apng',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: 'Image/ApnG',
      created_at: now,
      updated_at: now,
      ok: true,
    },

    {
      id: 1,
      user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      profile_path: 'profile.png',
      mime_type: 'application/javascript',
      created_at: now,
      updated_at: now,
      ok: false,
    },
  ];

  test.each(TestCase3)(
    'user profile entity가 정합성을 제대로 지키는지 확인',
    ({ id, user_id, profile_path, mime_type, created_at, updated_at, ok }) => {
      const test3 = () => {
        id = id as number;
        user_id = user_id as string;
        profile_path = profile_path as string;
        mime_type = mime_type as string;
        return new UserProfile({
          id,
          user_id,
          profile_path,
          mime_type,
        });
      };

      if (ok) {
        const t3 = test3();
        expect(t3.getId()).toBe(id);
        expect(t3.getUserId()).toBe(user_id?.trim());
        expect(t3.getProfilePath()).toBe(profile_path?.trim());
        expect(t3.getMimeType()).toBe(mime_type?.trim().toLowerCase());
      } else expect(test3).toThrow();
    },
  );
});
