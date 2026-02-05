const mergeUpdatesMock = jest.fn((updates: Uint8Array[]) => {
  if (!updates?.length) return new Uint8Array();
  if (updates.length === 1) return updates[0];

  const total = updates.reduce((acc, u) => acc + u.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const u of updates) {
    out.set(u, off);
    off += u.length;
  }
  return out;
});

jest.mock('yjs', () => {
  const mergeUpdates = jest.fn((updates: Uint8Array[]) => {
    if (!updates?.length) return new Uint8Array();
    if (updates.length === 1) return updates[0];

    const total = updates.reduce((acc, u) => acc + u.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const u of updates) {
      out.set(u, off);
      off += u.length;
    }
    return out;
  });

  return {
    __esModule: true,
    mergeUpdates,                 
    default: { mergeUpdates },   
  };
});

jest.mock('@/guards/guard.service', () => {
  return {
    GuardService: jest.fn().mockImplementation(() => ({
      verify: jest.fn(),
    })),
  };
});
import { GuardService } from "@/guards/guard.service";
import { REDIS_SERVER } from "@/infra/cache/cache.constants";
import { PendingRepository, SnapStateRepository, WhiteboardRepository } from "@/infra/memory/tool";
import { WhiteboardService } from "@/whiteboard/whiteboard.service";
import { Test } from "@nestjs/testing";
import { type RedisClientType } from "redis";
import * as Y from 'yjs';


describe("whiteboard에 단위 테스트 진행", () => {

  let service: WhiteboardService;

  type RedisLike = {
    hGetAll: jest.Mock;
    xRange: jest.Mock;
    xAdd: jest.Mock;
    xRevRange: jest.Mock;
    multi: jest.Mock;
  };

  const redisMock: RedisLike = {
    hGetAll: jest.fn(),
    xRange: jest.fn(),
    xAdd: jest.fn(),
    xRevRange: jest.fn(),
    multi: jest.fn(),
  };

  const guardMock = { verify: jest.fn() };

  const whiteboardRepoMock = {
    get: jest.fn(),
    ensure: jest.fn(),
    encodeFull: jest.fn(),
    applySnapshot: jest.fn(),
    applyAndAppendUpdate: jest.fn(),
    encodeSnapshot: jest.fn(),
    markSnapshot: jest.fn(),
  };

  const pendingMock = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const snapStateMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        WhiteboardService,
        { provide: GuardService, useValue: guardMock },
        { provide: REDIS_SERVER, useValue: redisMock },
        { provide: WhiteboardRepository, useValue: whiteboardRepoMock },
        { provide: PendingRepository, useValue: pendingMock },
        { provide: SnapStateRepository, useValue: snapStateMock },
      ],
    }).compile();

    service = moduleRef.get(WhiteboardService);
  });

  test('makeNamespace는 WHITEBOARD:<room_id> 형태를 만든다', () => {
    // WHITEBOARD_GROUP.WHITEBOARD 값이 'whiteboard' 라는 가정 (프로젝트 상수에 맞게 기대값 수정 가능)
    expect(service.makeNamespace('room-1')).toBe('whiteboard:ws:room-1');
  });

  test('normalizeToBuffer는 Buffer/Uint8Array/ArrayBuffer를 Buffer로 변환한다', () => {
    const b = Buffer.from([1, 2]);
    expect(service.normalizeToBuffer(b)).toBe(b);

    const u8 = new Uint8Array([3, 4]);
    expect(service.normalizeToBuffer(u8)).toEqual(Buffer.from([3, 4]));

    const ab = new Uint8Array([5, 6]).buffer;
    expect(service.normalizeToBuffer(ab)).toEqual(Buffer.from([5, 6]));

    expect(service.normalizeToBuffer(null)).toBeNull();
    expect(service.normalizeToBuffer('nope')).toBeNull();
  });

  test('normalizeToBuffers는 updates 배열 또는 update 단일값을 Buffer[]로 만든다', () => {
    const u1 = new Uint8Array([1]);
    const u2 = new Uint8Array([2]);

    expect(service.normalizeToBuffers({ updates: [u1, u2] } as any)).toEqual([
      Buffer.from([1]),
      Buffer.from([2]),
    ]);

    const single = new Uint8Array([9]);
    expect(service.normalizeToBuffers({ update: single } as any)).toEqual([Buffer.from([9])]);

    expect(service.normalizeToBuffers({ updates: 'x' } as any)).toBeNull();
    expect(service.normalizeToBuffers({} as any)).toBeNull();
  });

  test('appendUpdatesToStream: updates 비어있으면 0-0 반환', async () => {
    const id = await service.appendUpdatesToStream('room-1', [], 'user-1');
    expect(id).toBe('0-0');
    expect(redisMock.xAdd).not.toHaveBeenCalled();
  });

  test('appendUpdatesToStream: update 1개면 merge 없이 xAdd 1번 호출', async () => {
    (redisMock.xAdd as jest.Mock).mockResolvedValue('1-0');

    const u = new Uint8Array([1, 2, 3]);
    const id = await service.appendUpdatesToStream('room-1', [u], 'user-1');

    expect(redisMock.xAdd).toHaveBeenCalledTimes(1);
    expect(id).toBe('1-0');
  });
});