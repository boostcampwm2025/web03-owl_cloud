export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  // 1024를 몇 번 나누어야 하는지 지수(i)를 계산합니다.
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

export const parseRoomPath = (input: string): string => {
  const trimmedInput = input.trim();

  // 마지막 '/'의 위치를 찾음
  const lastSlashIndex = trimmedInput.lastIndexOf('/');

  // '/'가 존재하면 그 이후의 문자열을 코드라고 판단, 없으면 전체를 코드로 판단
  const code =
    lastSlashIndex !== -1
      ? trimmedInput.substring(lastSlashIndex + 1)
      : trimmedInput;

  return `/${code}`;
};
