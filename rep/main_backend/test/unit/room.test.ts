import { Room } from '@domain/room/entities';

describe('domain 레이어에 유저 entity 관련 단위테스트', () => {
  // 정합성에 사용될 데이터의 타입
  type TestCase1Props = {
    room_id: string | undefined;
    code: string | undefined;
    title: string | undefined;
    password_hash?: string | null | undefined;
    owner_user_id: string;
    max_participants: number;
    status: 'open' | 'closed' | undefined;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    deleted_at: Date | null | undefined;
    ok: boolean;
  };

  const now = new Date();
  const TestCase1: Array<TestCase1Props> = [
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: true,
    },
    {
      room_id: '           018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0         ',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: true,
    },
    {
      room_id: 'room_id',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '550e8400-e29b-41d4-a716-446655440000',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: undefined,
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(33).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: undefined,
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: Array(100).fill('t').join(''),
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: true,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: Array(101).fill('t').join(''),
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: undefined,
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash: undefined,
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: true,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash: 'password',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: 'user_id',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '      018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0       ',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: true,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '550e8400-e29b-41d4-a716-446655440000',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 0,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: -1,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'closed',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: true,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash:
        '$argon2id$v=19$m=65536,t=3,p=4$YWJjZGVmZ2hpamtsbW5vcA$w7ZxJwLJqz0mH9g7t6Hl8AnmVhZ+eakTnXh/J0Kv2g8',
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: undefined,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: false,
    },
    {
      room_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      code: Array(32).fill('c').join(''),
      title: '실험',
      password_hash: null,
      owner_user_id: '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
      max_participants: 100,
      status: 'open',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      ok: true,
    },
  ];
  test.each(TestCase1)(
    'room에 대한 정합성 테스트',
    ({ room_id, code, title, password_hash, owner_user_id, max_participants, status, ok }) => {
      const test1 = () => {
        room_id = room_id as unknown as string;
        code = code as unknown as string;
        title = title as unknown as string;
        owner_user_id = owner_user_id as unknown as string;
        status = status as unknown as 'open' | 'closed';
        return new Room({
          room_id,
          code,
          title,
          password_hash,
          owner_user_id,
          max_participants,
          status,
        });
      };
      if (ok) {
        const t = test1();
        expect(t.getRoomId()).toBe(room_id?.trim());
        expect(t.getCode()).toBe(code?.trim());
        expect(t.getTitle()).toBe(title?.trim());
        expect(t.getOwnerUserId()).toBe(owner_user_id.trim());
        expect(t.getStatus()).toBe(status?.trim());
        expect(t.getMaxParticipants()).toBe(max_participants);
      } else expect(test1).toThrow();
    },
  );
});
