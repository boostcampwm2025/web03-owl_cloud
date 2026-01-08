// whiteboard 에서 사용되는 색상 상수들

// 기본 색상
export const COLORS = {
  transparent: 'transparent',
  white: '#ffffff',
  black: '#343a40',
  gray: '#adb5bd',
  red: '#ff8787',
  orange: '#ffc078',
  yellow: '#ffe066',
  green: '#69db7c',
  blue: '#74c0fc',
  indigo: '#91a7ff',
  purple: '#b197fc',
} as const;

// 전체 팔레트 순서 (10개)
// 투명이 있는 경우
// 1열: 투명, 흰색, 검정, 빨강, 주황
// 2열: 노랑, 초록, 파랑, 남색, 보라
export const FULL_PALETTE = [
  COLORS.transparent,
  COLORS.white,
  COLORS.black,
  COLORS.red,
  COLORS.orange,
  COLORS.yellow,
  COLORS.green,
  COLORS.blue,
  COLORS.indigo,
  COLORS.purple,
];

// 투명이 없는 경우
// 1열 : 흰색, 검정, 회색, 빨강, 주황
// 2열 : 노랑, 초록, 파랑, 남색, 보라
// (투명 대신 회색이 들어감)
export const NO_TRANSPARENT_PALETTE = [
  COLORS.white,
  COLORS.black,
  COLORS.gray,
  COLORS.red,
  COLORS.orange,
  COLORS.yellow,
  COLORS.green,
  COLORS.blue,
  COLORS.indigo,
  COLORS.purple,
];

export const COLOR_NAMES: Record<string, string> = {
  [COLORS.transparent]: '투명',
  [COLORS.white]: '흰색',
  [COLORS.black]: '검은색',
  [COLORS.gray]: '회색',
  [COLORS.red]: '빨강색',
  [COLORS.orange]: '주황색',
  [COLORS.yellow]: '노랑색',
  [COLORS.green]: '초록색',
  [COLORS.blue]: '파랑색',
  [COLORS.indigo]: '남색',
  [COLORS.purple]: '보라색',
};
