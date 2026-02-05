import { FileContent, TextContent } from '@/types/chat';
import {
  emitAck,
  isSameMinute,
  mapRecvPayloadToChatMessage,
  pickCategory,
  putToPresignedUrl,
  sliceFile,
} from '../chat';
import { RecvMessagePayload } from '@/hooks/chat/useChatSocket';

describe('pickCategory 함수 테스트', () => {
  it('타입이 image mime이면 image를 반환해야 한다.', () => {
    const file = new File(['a'], 'a.png', { type: 'image/png' });
    expect(pickCategory(file)).toBe('image');
  });

  it('타입이 video mime이면 video를 반환해야 한다.', () => {
    const file = new File(['a'], 'a.mp4', { type: 'video/mp4' });
    expect(pickCategory(file)).toBe('video');
  });

  it('타입이 json이면 text를 반환해야 한다.', () => {
    const file = new File(['a'], 'a.json', { type: 'application/json' });
    expect(pickCategory(file)).toBe('text');
  });

  it('알 수 없는 타입이면 binary를 반환해야 한다.', () => {
    const file = new File(['a'], 'a.bin', { type: 'application/octet-stream' });
    expect(pickCategory(file)).toBe('binary');
  });
});

describe('sliceFile 함수 테스트', () => {
  it('인자로 들어온 파일은 partSize 기준으로 분할되어야 한다.', () => {
    const file = new File(['abcdefghij'], 'a.txt'); // 10 byte
    const parts = sliceFile(file, 4);

    expect(parts.length).toBe(3);
    expect(parts[0].partNumber).toBe(1);
    expect(parts[1].partNumber).toBe(2);
    expect(parts[2].partNumber).toBe(3);

    expect(parts[0].blob.size).toBe(4);
    expect(parts[1].blob.size).toBe(4);
    expect(parts[2].blob.size).toBe(2);
  });

  it('partSize가 파일보다 크면 1개만 나와야 한다.', () => {
    const file = new File(['abc'], 'a.txt');
    const parts = sliceFile(file, 100);

    expect(parts.length).toBe(1);
    expect(parts[0].blob.size).toBe(3);
  });
});

describe('putToPresignedUrl 함수 테스트', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('성공 시 etag를 반환해야 한다.', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: () => '"etag123"',
      },
    });

    const blob = new Blob(['abc']);

    const etag = await putToPresignedUrl({
      upload_url: 'http://test',
      blob,
    });

    expect(etag).toBe('etag123');
  });

  it('res.ok가 false면 에러를 던져야 한다.', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'bad',
      headers: { get: () => null },
    });

    await expect(
      putToPresignedUrl({
        upload_url: 'http://test',
        blob: new Blob(['a']),
      }),
    ).rejects.toThrow('S3 PUT failed');
  });

  it('etag가 없으면 에러를 던져야 한다.', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => null },
    });

    await expect(
      putToPresignedUrl({
        upload_url: 'http://test',
        blob: new Blob(['a']),
      }),
    ).rejects.toThrow('ETag missing');
  });
});

describe('emitAck 함수 테스트', () => {
  it('정상 응답이면 resolve되어야 한다.', async () => {
    const socket = {
      emit: jest.fn((event, payload, cb) => {
        cb({ ok: true });
      }),
    } as any;

    const res = await emitAck(socket, 'event', { a: 1 });

    expect(res).toEqual({ ok: true });
  });

  it('error 응답이면 reject되어야 한다.', async () => {
    const socket = {
      emit: jest.fn((event, payload, cb) => {
        cb({ error: 'fail' });
      }),
    } as any;

    await expect(emitAck(socket, 'event')).rejects.toThrow('fail');
  });

  it('timeout이 발생하면 reject되어야 한다.', async () => {
    jest.useFakeTimers();

    const socket = {
      emit: jest.fn(), // callback 안 부름
    } as any;

    const promise = emitAck(socket, 'event', {}, 1000);

    jest.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('timeout');

    jest.useRealTimers();
  });
});

describe('mapRecvPayloadToChatMessage 함수 테스트', () => {
  beforeEach(() => {
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-1');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('payload 타입이 message이면 text 메시지로 매핑되어야 한다.', () => {
    const payload: RecvMessagePayload = {
      type: 'message',
      user_id: 'u1',
      nickname: 'nick',
      profileImg: 'img.png',
      message: 'hello',
    };

    const msg = mapRecvPayloadToChatMessage(payload);

    expect(msg).toMatchObject({
      id: 'uuid-1',
      userId: 'u1',
      nickname: 'nick',
      profileImg: 'img.png',
    });

    expect(msg.content.type).toBe('text');
    expect((msg.content as TextContent).text).toBe('hello');
  });

  it('payload 타입이 file이면 파일 메시지로 매핑되어야 한다.', () => {
    const payload: RecvMessagePayload = {
      type: 'file',
      user_id: 'u2',
      nickname: 'kim',
      profileImg: undefined,
      file_id: 'file-1',
      filename: 'photo.png',
      size: 2048,
      category: 'image',
      thumbnail_url: 'http://cdn/test.png',
    };

    const msg = mapRecvPayloadToChatMessage(payload);

    expect(msg).toMatchObject({
      id: 'uuid-1',
      userId: 'u2',
      nickname: 'kim',
    });

    expect(msg.content.type).toBe('file');
    expect((msg.content as FileContent).fileId).toBe('file-1');
    expect((msg.content as FileContent).filename).toBe('photo.png');
    expect((msg.content as FileContent).size).toBe(2048);
    expect((msg.content as FileContent).category).toBe('image');
    expect((msg.content as FileContent).fileUrl).toBe('http://cdn/test.png');
  });
});

describe('isSameMinute 함수 테스트', () => {
  it('같은 분이면 true', () => {
    expect(isSameMinute('2026-01-01T10:10:01Z', '2026-01-01T10:10:59Z')).toBe(
      true,
    );
  });

  it('1분 차이면 false', () => {
    expect(isSameMinute('2026-01-01T10:10:00Z', '2026-01-01T10:11:00Z')).toBe(
      false,
    );
  });

  it('날짜 다르면 false', () => {
    expect(isSameMinute('2026-01-01T10:10:00Z', '2026-01-02T10:10:00Z')).toBe(
      false,
    );
  });
});
