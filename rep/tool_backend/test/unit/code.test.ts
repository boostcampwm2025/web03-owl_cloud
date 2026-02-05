jest.mock('@/guards/guard.service', () => {
  return {
    GuardService: jest.fn().mockImplementation(() => ({
      verify: jest.fn(),
    })),
  };
});

import { CodeeditorService } from "@/codeeditor/codeeditor.service";
import { RedisClientType } from "redis";
import { Test } from "@nestjs/testing";
import { GuardService } from "@/guards/guard.service";
import { REDIS_SERVER } from "@/infra/cache/cache.constants";
import { CodeeditorRepository } from "@/infra/memory/tool";


describe("codeeditor service 함수의 단위 테스트 진행", () => {
  
  // 테스트를 위한 mock 함수 정리
  let service: CodeeditorService;

  const redisMock: Partial<RedisClientType> = {
    hGetAll: jest.fn(),
    xRange: jest.fn(),
    xAdd: jest.fn(),
    xRevRange: jest.fn(),
    multi: jest.fn(),
  };

  const guardMock = {
    verify: jest.fn(),
  };

  const repoMock = {
    get: jest.fn(),
    ensure: jest.fn(),
    encodeFull: jest.fn(),
    applySnapshot: jest.fn(),
    applyAndAppendUpdate: jest.fn(),
    encodeSnapshot: jest.fn(),
  };

  beforeEach(async () => {

    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers : [
        CodeeditorService,
        {
          provide : GuardService, useValue : guardMock
        },
        {
          provide : REDIS_SERVER, useValue : redisMock
        },
        {
          provide : CodeeditorRepository, useValue : repoMock
        }
      ]
    }).compile();

    service = moduleRef.get(CodeeditorService);
  });

  test("makeNamespace는 CODEEDITOR:ws:<room_id> 형태를 만든다", () => {
    expect(service.makeNamespace('room-1')).toBe('codeeditor:ws:room-1'); 
  });

  test("normalizeToBuffer는 Buffer/Uint8Array/ArrayBuffer를 Buffer로 변환한다", () => {
    const b = Buffer.from([1, 2]);
    expect(service.normalizeToBuffer(b)).toBe(b);

    const u8 = new Uint8Array([3, 4]);
    expect(service.normalizeToBuffer(u8)).toEqual(Buffer.from([3, 4]));

    const ab = new Uint8Array([5, 6]).buffer;
    expect(service.normalizeToBuffer(ab)).toEqual(Buffer.from([5, 6]));

    expect(service.normalizeToBuffer(null)).toBeNull();
    expect(service.normalizeToBuffer('nope')).toBeNull();
  });

  test("normalizeToBuffers는 updates 배열 또는 update 단일값을 Buffer[]로 만든다", () => {
    // updates 우선
    const u1 = new Uint8Array([1]);
    const u2 = new Uint8Array([2]);
    expect(service.normalizeToBuffers({ updates: [u1, u2] } as any)).toEqual([
      Buffer.from([1]),
      Buffer.from([2]),
    ]);

    // update fallback
    const single = new Uint8Array([9]);
    expect(service.normalizeToBuffers({ update: single } as any)).toEqual([Buffer.from([9])]);

    // 잘못된 형태
    expect(service.normalizeToBuffers({ updates: 'x' } as any)).toBeNull();
    expect(service.normalizeToBuffers({} as any)).toBeNull();
  });

  test("appendUpdatesToStream: updates 만큼 xAdd 호출하고 마지막 ID를 반환한다", async () => {
    (redisMock.xAdd as jest.Mock)
      .mockResolvedValueOnce('1-0')
      .mockResolvedValueOnce('2-0');

    const last = await service.appendUpdatesToStream(
      'room-1',
      [new Uint8Array([1]), new Uint8Array([2])],
      'user-1',
    );

    expect(redisMock.xAdd).toHaveBeenCalledTimes(2);
    expect(last).toBe('2-0');    
  });

  test('maybeSnapShot: seq % SNAPSHOT_N !== 0 이면 아무것도 안 한다', async () => {
    repoMock.ensure.mockReturnValue({ seq: 1 }); // SNAPSHOT_N=300이면 미충족
    await service.maybeSnapShot('room-1');

    expect(repoMock.encodeSnapshot).not.toHaveBeenCalled();
    expect(redisMock.multi).not.toHaveBeenCalled();
  });

  test('maybeSnapShot: 조건 충족 시 snapshot 저장 + xTrim을 multi로 실행한다', async () => {
    repoMock.ensure.mockReturnValue({ seq: 300 }); // 조건 충족
    repoMock.encodeSnapshot.mockReturnValue(new Uint8Array([7, 8])); // snap

    (redisMock.xRevRange as jest.Mock).mockResolvedValue([{ id: '99-0', message: {} }]);

    const txMock = {
      hSet: jest.fn().mockReturnThis(),
      xTrim: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([1, 1]),
    };
    (redisMock.multi as jest.Mock).mockReturnValue(txMock);

    await service.maybeSnapShot('room-1');

    expect(repoMock.encodeSnapshot).toHaveBeenCalledWith('room-1');
    expect(redisMock.xRevRange).toHaveBeenCalledTimes(1);
    expect(redisMock.multi).toHaveBeenCalledTimes(1);

    expect(txMock.hSet).toHaveBeenCalledTimes(1);
    expect(txMock.xTrim).toHaveBeenCalledTimes(1);
    expect(txMock.exec).toHaveBeenCalledTimes(1);
  });

});