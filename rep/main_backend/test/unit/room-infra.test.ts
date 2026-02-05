import { CacheError, NotAllowToolPayload, NotAllowToolTicket } from "@error/infra/infra.error";
import { CheckRoomMemberFromRedis, CheckRoomUserFromRedis, CheckToolTicketFromRedis, CheckUserAndSelectFileInfoFromRedis, CheckUserAndSelectPrevFileInfoFromRedis, CheckUserPayloadFromRedis, SelectRoomInfoDataFromRedis, SelectRoomInfoFromRedis, SelectRoomMemberInfosFromRedis } from "@infra/cache/redis/room/room.inbound";
import { CACHE_ROOM_FILES_KEY_PROPS_NAME, CACHE_ROOM_INFO_KEY_NAME, CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME, CACHE_ROOM_MEMBERS_KEY_PROPS_NAME, CACHE_SFU_PRODUCES_KEY_PROPS_NAME, REDIS_SERVER } from "@infra/cache/cache.constants";
import { Test } from "@nestjs/testing";

// test/utils/redis-mock.ts
type TxMock = {
  hGetAll: jest.Mock;
  hGet: jest.Mock;
  hExists: jest.Mock;
  hDel: jest.Mock;
  exec: jest.Mock;
};

export type RedisMock = {
  hGetAll: jest.Mock;
  hGet: jest.Mock;
  hExists: jest.Mock;
  hDel: jest.Mock;
  eval: jest.Mock;
  multi: jest.Mock; 
  __tx: TxMock;
};

export const createRedisMock = (): RedisMock => {
  const tx: TxMock = {
    hGetAll: jest.fn().mockReturnThis(),
    hGet: jest.fn().mockReturnThis(),
    hExists: jest.fn().mockReturnThis(),
    hDel: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  return {
    hGetAll: jest.fn(),
    hGet: jest.fn(),
    hExists: jest.fn(),
    hDel: jest.fn(),
    eval: jest.fn(),
    multi: jest.fn(() => tx),
    __tx: tx,
  };
};

describe('Room Redis infra selectors - unit tests', () => {
  const makeModule = async (providers: any[], redis: RedisMock) => {
    return Test.createTestingModule({
      providers: [...providers, { provide: REDIS_SERVER, useValue: redis }],
    }).compile();
  };

  describe('SelectRoomInfoFromRedis', () => {
    it('roomInfo hash empty -> undefined', async () => {
      const redis = createRedisMock();
      redis.hGetAll.mockResolvedValue({});

      const moduleRef = await makeModule([SelectRoomInfoFromRedis], redis);
      const sut = moduleRef.get(SelectRoomInfoFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });
      expect(res).toBeUndefined();
    });

    it('normal -> numbers cast + password nullable', async () => {
      const redis = createRedisMock();
      redis.hGetAll.mockResolvedValue({
        code: 'c1',
        title: 't1',
        owner_id: 'u1',
        max_particiants: '10',
        current_particiants: '3',
        password_hash: '',
      });

      const moduleRef = await makeModule([SelectRoomInfoFromRedis], redis);
      const sut = moduleRef.get(SelectRoomInfoFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });

      expect(res).toEqual({
        code: 'c1',
        title: 't1',
        owner_id: 'u1',
        max_particiants: 10,
        current_particiants: 3,
        password_hash: null,
      });
    });

    it('password_hash exists -> keep string', async () => {
      const redis = createRedisMock();
      redis.hGetAll.mockResolvedValue({
        code: 'c1',
        title: 't1',
        owner_id: 'u1',
        max_particiants: '10',
        current_particiants: '3',
        password_hash: 'hash',
      });

      const moduleRef = await makeModule([SelectRoomInfoFromRedis], redis);
      const sut = moduleRef.get(SelectRoomInfoFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });
      expect(res?.password_hash).toBe('hash');
    });
  });

  describe('SelectRoomMemberInfosFromRedis', () => {
    it('empty members -> members=[] and main null if both producer null', async () => {
      const redis = createRedisMock();

      // getRoomMembersAndMainSub() multi exec #1
      redis.__tx.exec.mockResolvedValueOnce([{}, null, null]);

      const moduleRef = await makeModule([SelectRoomMemberInfosFromRedis], redis);
      const sut = moduleRef.get(SelectRoomMemberInfosFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });

      expect(res.members).toEqual([]);
      expect(res.main).toBeNull();
    });

    it('members parse + attach producers + main/sub build', async () => {
      const redis = createRedisMock();

      const membersHash = {
        u1: JSON.stringify({
          [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME]: 'alice',
          [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST]: 'false',
        }),
        u2: JSON.stringify({
          [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME]: 'bob',
          [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST]: 'true',
        }),
      };

      const mainProducerRaw = JSON.stringify({
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID]: 'u1',
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID]: 'p-main',
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND]: 'video',
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE]: 'cam',
      });

      const subProducerRaw = JSON.stringify({
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID]: 'u2',
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID]: 'p-sub',
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND]: 'audio',
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE]: 'mic',
      });

      // exec 1: getRoomMembersAndMainSub
      // exec 2: attachUserProducers (u1 audio, u1 video, u2 audio, u2 video)
      redis.__tx.exec
        .mockResolvedValueOnce([membersHash, mainProducerRaw, subProducerRaw])
        .mockResolvedValueOnce([
          JSON.stringify({
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID]: 'mic1',
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE]: 'mic',
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.KIND]: 'audio',
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS]: 'on',
          }),
          JSON.stringify({
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID]: 'cam1',
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE]: 'cam',
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.KIND]: 'video',
            [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS]: 'off',
          }),
          null,
          null,
        ]);

      const moduleRef = await makeModule([SelectRoomMemberInfosFromRedis], redis);
      const sut = moduleRef.get(SelectRoomMemberInfosFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });

      expect(res.members).toHaveLength(2);

      const m1 = res.members.find((m: any) => m.user_id === 'u1');
      const m2 = res.members.find((m: any) => m.user_id === 'u2');

      expect(m1).toMatchObject({
        user_id: 'u1',
        nickname: 'alice',
        is_guest: false,
        mic: { type: 'mic', kind: 'audio', provider_id: 'mic1', is_paused: false },
        cam: { type: 'cam', kind: 'video', provider_id: 'cam1', is_paused: true },
      });

      expect(m2).toMatchObject({
        user_id: 'u2',
        nickname: 'bob',
        is_guest: true,
        mic: null,
        cam: null,
      });

      expect(res.main).toEqual({
        main: {
          user_id: 'u1',
          nickname: 'alice',
          provider_id: 'p-main',
          kind: 'video',
          type: 'cam',
        },
        sub: {
          user_id: 'u2',
          nickname: 'bob',
          provider_id: 'p-sub',
          kind: 'audio',
          type: 'mic',
        },
      });
    });

    it('main/sub producer has tool -> ProviderToolInfo', async () => {
      const redis = createRedisMock();

      const membersHash = {
        u1: JSON.stringify({
          [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME]: 'alice',
          [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST]: 'false',
        }),
      };

      const mainProducerRaw = JSON.stringify({
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID]: 'u1',
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TOOL]: 'whiteboard',
      });

      // exec 1: members/main/sub
      // exec 2: attach producers for 1 member (audio, video)
      redis.__tx.exec
        .mockResolvedValueOnce([membersHash, mainProducerRaw, null])
        .mockResolvedValueOnce([null, null]);

      const moduleRef = await makeModule([SelectRoomMemberInfosFromRedis], redis);
      const sut = moduleRef.get(SelectRoomMemberInfosFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });

      expect(res.main).toEqual({
        main: { user_id: 'u1', tool: 'whiteboard' },
        sub: null,
      });
    });

    it('broken JSON in members -> safeJsonParse -> default fields', async () => {
      const redis = createRedisMock();

      const membersHash = {
        u1: '{broken-json',
      };

      redis.__tx.exec
        .mockResolvedValueOnce([membersHash, null, null])
        .mockResolvedValueOnce([null, null]); // attach producers

      const moduleRef = await makeModule([SelectRoomMemberInfosFromRedis], redis);
      const sut = moduleRef.get(SelectRoomMemberInfosFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });

      expect(res.members[0]).toMatchObject({
        user_id: 'u1',
        nickname: '',
        is_guest: false, // default 'false'
        mic: null,
        cam: null,
      });
    });
  });

  describe('CheckUserPayloadFromRedis', () => {
    it('member exists + mainProducer empty -> true', async () => {
      const redis = createRedisMock();

      // multi().hExists().hGet().exec() returns [memberExists, mainProducer]
      redis.__tx.exec.mockResolvedValueOnce([1, null]);

      const moduleRef = await makeModule([CheckUserPayloadFromRedis], redis);
      const sut = moduleRef.get(CheckUserPayloadFromRedis);

      const ok = await sut.select({ namespace: 'room1', keyName: 'u1' });
      expect(ok).toBe(true);
    });

    it('member exists + mainProducer exists -> false', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([1, '{"x":1}']);

      const moduleRef = await makeModule([CheckUserPayloadFromRedis], redis);
      const sut = moduleRef.get(CheckUserPayloadFromRedis);

      const ok = await sut.select({ namespace: 'room1', keyName: 'u1' });
      expect(ok).toBe(false);
    });

    it('member not exists -> false', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([0, null]);

      const moduleRef = await makeModule([CheckUserPayloadFromRedis], redis);
      const sut = moduleRef.get(CheckUserPayloadFromRedis);

      const ok = await sut.select({ namespace: 'room1', keyName: 'u1' });
      expect(ok).toBe(false);
    });
  });

  describe('CheckToolTicketFromRedis', () => {
    it('invalid keyName format -> NotAllowToolPayload', async () => {
      const redis = createRedisMock();

      const moduleRef = await makeModule([CheckToolTicketFromRedis], redis);
      const sut = moduleRef.get(CheckToolTicketFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'u1:whiteboard' })).rejects.toBeInstanceOf(
        NotAllowToolPayload,
      );
    });

    it('eval OK -> true', async () => {
      const redis = createRedisMock();
      redis.eval.mockResolvedValue([1, 'OK']);

      const moduleRef = await makeModule([CheckToolTicketFromRedis], redis);
      const sut = moduleRef.get(CheckToolTicketFromRedis);

      const ok = await sut.select({ namespace: 'room1', keyName: 'u1:whiteboard:t1' });
      expect(ok).toBe(true);
    });

    it('NO_TICKET -> NotAllowToolTicket', async () => {
      const redis = createRedisMock();
      redis.eval.mockResolvedValue([0, 'NO_TICKET']);

      const moduleRef = await makeModule([CheckToolTicketFromRedis], redis);
      const sut = moduleRef.get(CheckToolTicketFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'u1:whiteboard:t1' })).rejects.toBeInstanceOf(
        NotAllowToolTicket,
      );
    });

    it('TICKET_MISMATCH -> NotAllowToolTicket', async () => {
      const redis = createRedisMock();
      redis.eval.mockResolvedValue([0, 'TICKET_MISMATCH']);

      const moduleRef = await makeModule([CheckToolTicketFromRedis], redis);
      const sut = moduleRef.get(CheckToolTicketFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'u1:whiteboard:t1' })).rejects.toBeInstanceOf(
        NotAllowToolTicket,
      );
    });

    it('NO_PRODUCER -> NotAllowToolPayload', async () => {
      const redis = createRedisMock();
      redis.eval.mockResolvedValue([0, 'NO_PRODUCER']);

      const moduleRef = await makeModule([CheckToolTicketFromRedis], redis);
      const sut = moduleRef.get(CheckToolTicketFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'u1:whiteboard:t1' })).rejects.toBeInstanceOf(
        NotAllowToolPayload,
      );
    });

    it('unknown reason -> NotAllowToolTicket (default)', async () => {
      const redis = createRedisMock();
      redis.eval.mockResolvedValue([0, 'SOMETHING_ELSE']);

      const moduleRef = await makeModule([CheckToolTicketFromRedis], redis);
      const sut = moduleRef.get(CheckToolTicketFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'u1:whiteboard:t1' })).rejects.toBeInstanceOf(
        NotAllowToolTicket,
      );
    });
  });

  describe('CheckRoomUserFromRedis', () => {
    it('invalid format -> NotAllowToolPayload', async () => {
      const redis = createRedisMock();
      const moduleRef = await makeModule([CheckRoomUserFromRedis], redis);
      const sut = moduleRef.get(CheckRoomUserFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'u1' })).rejects.toBeInstanceOf(NotAllowToolPayload);
    });

    it('invalid tool -> NotAllowToolPayload', async () => {
      const redis = createRedisMock();
      const moduleRef = await makeModule([CheckRoomUserFromRedis], redis);
      const sut = moduleRef.get(CheckRoomUserFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'u1:chat' })).rejects.toBeInstanceOf(NotAllowToolPayload);
    });

    it('member exists but mainProducer missing -> false', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([1, null]);

      const moduleRef = await makeModule([CheckRoomUserFromRedis], redis);
      const sut = moduleRef.get(CheckRoomUserFromRedis);

      const ok = await sut.select({ namespace: 'room1', keyName: 'u1:whiteboard' });
      expect(ok).toBe(false);
    });

    it('member exists and mainProducer tool matches -> true', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([1, JSON.stringify({ tool: 'whiteboard' })]);

      const moduleRef = await makeModule([CheckRoomUserFromRedis], redis);
      const sut = moduleRef.get(CheckRoomUserFromRedis);

      const ok = await sut.select({ namespace: 'room1', keyName: 'u1:whiteboard' });
      expect(ok).toBe(true);
    });

    it('member exists and mainProducer tool mismatch -> false', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([1, JSON.stringify({ tool: 'codeeditor' })]);

      const moduleRef = await makeModule([CheckRoomUserFromRedis], redis);
      const sut = moduleRef.get(CheckRoomUserFromRedis);

      const ok = await sut.select({ namespace: 'room1', keyName: 'u1:whiteboard' });
      expect(ok).toBe(false);
    });
  });

  describe('SelectRoomInfoDataFromRedis', () => {
    it('hGetAll -> cast numbers', async () => {
      const redis = createRedisMock();
      redis.hGetAll.mockResolvedValue({
        [CACHE_ROOM_INFO_KEY_NAME.CURRENT_PARTICIANTS]: '5',
        [CACHE_ROOM_INFO_KEY_NAME.MAX_PARTICIANTS]: '10',
      });

      const moduleRef = await makeModule([SelectRoomInfoDataFromRedis], redis);
      const sut = moduleRef.get(SelectRoomInfoDataFromRedis);

      const res = await sut.select({ namespace: 'room1', keyName: 'ignored' });

      expect(res).toEqual({
        current_participants: 5,
        max_participants: 10,
      });
    });
  });

  describe('CheckUserAndSelectPrevFileInfoFromRedis', () => {
    it('namespace invalid -> CacheError', async () => {
      const redis = createRedisMock();

      const moduleRef = await makeModule([CheckUserAndSelectPrevFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectPrevFileInfoFromRedis);

      await expect(sut.select({ namespace: 'room1', keyName: 'f.png:image/png:1' })).rejects.toBeInstanceOf(CacheError);
    });

    it('user not in room -> CacheError', async () => {
      const redis = createRedisMock();
      redis.hExists.mockResolvedValue(false);

      const moduleRef = await makeModule([CheckUserAndSelectPrevFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectPrevFileInfoFromRedis);

      await expect(
        sut.select({ namespace: 'room1:u1', keyName: 'f.png:image/png:1' }),
      ).rejects.toBeInstanceOf(CacheError);
    });

    it('file_id mapping missing -> undefined', async () => {
      const redis = createRedisMock();
      redis.hExists.mockResolvedValue(true);
      redis.hGet.mockResolvedValue(null); // file_id 없음

      const moduleRef = await makeModule([CheckUserAndSelectPrevFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectPrevFileInfoFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'f.png:image/png:1' });
      expect(res).toBeUndefined();
    });

    it('file info valid -> return file_id/status/upload_id', async () => {
      const redis = createRedisMock();
      redis.hExists.mockResolvedValue(true);

      // 1) file id mapping
      redis.hGet.mockResolvedValueOnce('file-1');

      // 2) file info json
      redis.hGet.mockResolvedValueOnce(
        JSON.stringify({
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS]: 'uploading',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.UPLOAD_ID]: 'up-1',
        }),
      );

      const moduleRef = await makeModule([CheckUserAndSelectPrevFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectPrevFileInfoFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'f.png:image/png:1' });

      expect(res).toEqual({ file_id: 'file-1', status: 'uploading', upload_id: 'up-1' });
    });

    it('file info broken json -> hDel called + undefined', async () => {
      const redis = createRedisMock();
      redis.hExists.mockResolvedValue(true);

      redis.hGet.mockResolvedValueOnce('file-1'); // mapping
      redis.hGet.mockResolvedValueOnce('{broken-json'); // file info broken

      const moduleRef = await makeModule([CheckUserAndSelectPrevFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectPrevFileInfoFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'f.png:image/png:1' });

      expect(res).toBeUndefined();
      expect(redis.hDel).toHaveBeenCalledTimes(1); // 불량 삭제
    });
  });

  describe('CheckUserAndSelectFileInfoFromRedis', () => {
    it('not member or no file -> undefined', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([0, null]);

      const moduleRef = await makeModule([CheckUserAndSelectFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectFileInfoFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });
      expect(res).toBeUndefined();
    });

    it('invalid file data -> hDel called + undefined', async () => {
      const redis = createRedisMock();

      // member exists, rawFileInfo exists
      redis.__tx.exec.mockResolvedValueOnce([
        1,
        JSON.stringify({
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.FILENAME]: 123, // invalid type
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.MIME_TYPE]: 'image/png',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.CATEGORY]: 'image',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.SIZE]: 10,
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.NICKNAME]: 'n',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS]: 'completed',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.UPLOAD_ID]: null,
        }),
      ]);

      const moduleRef = await makeModule([CheckUserAndSelectFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectFileInfoFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });

      expect(res).toBeUndefined();
      expect(redis.hDel).toHaveBeenCalledTimes(1);
    });

    it('valid file data -> returns validate result', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([
        1,
        JSON.stringify({
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.FILENAME]: 'a.png',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.MIME_TYPE]: 'image/png',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.CATEGORY]: 'image',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.SIZE]: 10,
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.NICKNAME]: 'nick',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS]: 'uploading',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.UPLOAD_ID]: 'up-1',
        }),
      ]);

      const moduleRef = await makeModule([CheckUserAndSelectFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectFileInfoFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });

      expect(res).toEqual({
        status: 'uploading',
        filename: 'a.png',
        size: 10,
        category: 'image',
        upload_id: 'up-1',
        nickname: 'nick',
        mime_type: 'image/png',
      });
    });

    it('broken JSON -> hDel called + undefined', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([1, '{broken-json']);

      const moduleRef = await makeModule([CheckUserAndSelectFileInfoFromRedis], redis);
      const sut = moduleRef.get(CheckUserAndSelectFileInfoFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });

      expect(res).toBeUndefined();
      expect(redis.hDel).toHaveBeenCalledTimes(1);
    });
  });

  describe('CheckRoomMemberFromRedis', () => {
    it('not member or no file -> undefined', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([0, null]);

      const moduleRef = await makeModule([CheckRoomMemberFromRedis], redis);
      const sut = moduleRef.get(CheckRoomMemberFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });
      expect(res).toBeUndefined();
    });

    it('file not completed -> undefined', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([
        1,
        JSON.stringify({
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS]: 'uploading',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.FILENAME]: 'a.png',
        }),
      ]);

      const moduleRef = await makeModule([CheckRoomMemberFromRedis], redis);
      const sut = moduleRef.get(CheckRoomMemberFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });
      expect(res).toBeUndefined();
    });

    it('completed + valid filename -> returns filename', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([
        1,
        JSON.stringify({
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS]: 'completed',
          [CACHE_ROOM_FILES_KEY_PROPS_NAME.FILENAME]: 'a.png',
        }),
      ]);

      const moduleRef = await makeModule([CheckRoomMemberFromRedis], redis);
      const sut = moduleRef.get(CheckRoomMemberFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });
      expect(res).toBe('a.png');
    });

    it('broken JSON -> undefined', async () => {
      const redis = createRedisMock();
      redis.__tx.exec.mockResolvedValueOnce([1, '{broken-json']);

      const moduleRef = await makeModule([CheckRoomMemberFromRedis], redis);
      const sut = moduleRef.get(CheckRoomMemberFromRedis);

      const res = await sut.select({ namespace: 'room1:u1', keyName: 'file-1' });
      expect(res).toBeUndefined();
    });
  });
});