import {
  formatFileSize,
  formatTimestamp,
  parseRoomPath,
} from '@/utils/formatter';

describe('formatFileSize', () => {
  it('0 bytes는 "0 Bytes"를 반환한다', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('1 byte는 "1 Bytes"를 반환한다', () => {
    expect(formatFileSize(1)).toBe('1 Bytes');
  });

  it('1023 bytes는 KB로 변환되지 않는다', () => {
    expect(formatFileSize(1023)).toBe('1023 Bytes');
  });

  it('1024 bytes부터 KB 단위로 변환된다', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('KB → MB 경계에서 올바르게 변환된다', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('소수점 자릿수를 지정할 수 있다', () => {
    expect(formatFileSize(1536, 0)).toBe('2 KB');
  });

  it('매우 큰 값도 문자열로 반환된다', () => {
    expect(typeof formatFileSize(Number.MAX_SAFE_INTEGER)).toBe('string');
  });
});

describe('formatTimestamp', () => {
  it('유효한 ISO 문자열을 한국 시간 형식으로 포맷한다', () => {
    const result = formatTimestamp('2024-01-01T00:30:00Z');
    expect(result).toMatch(/(오전|오후)/);
  });

  it('epoch(0)도 정상 포맷된다', () => {
    const result = formatTimestamp('1970-01-01T00:00:00Z');
    expect(typeof result).toBe('string');
  });

  it('유효하지 않은 문자열이 들어와도 문자열을 반환한다', () => {
    const result = formatTimestamp('invalid-date');
    expect(typeof result).toBe('string');
  });

  it('빈 문자열 입력도 안전하게 처리된다', () => {
    const result = formatTimestamp('');
    expect(typeof result).toBe('string');
  });
});

describe('parseRoomPath', () => {
  it('전체 URL에서 마지막 경로를 추출한다', () => {
    expect(parseRoomPath('https://devmeet.com/abcd1234')).toBe('/abcd1234');
  });

  it('슬래시 없는 문자열은 그대로 사용한다', () => {
    expect(parseRoomPath('roomCode')).toBe('/roomCode');
  });

  it('앞뒤 공백을 제거하고 처리한다', () => {
    expect(parseRoomPath('  https://devmeet.com/xyz  ')).toBe('/xyz');
  });

  it('여러 경로 중 마지막 값만 사용한다', () => {
    expect(parseRoomPath('/rooms/meeting/hello')).toBe('/hello');
  });

  it('입력이 "/" 인 경우 빈 경로를 반환한다', () => {
    expect(parseRoomPath('/')).toBe('/');
  });

  it('빈 문자열 입력도 안전하게 처리한다', () => {
    expect(parseRoomPath('')).toBe('/');
  });

  it('공백만 있는 입력도 안전하게 처리한다', () => {
    expect(parseRoomPath('   ')).toBe('/');
  });
});
