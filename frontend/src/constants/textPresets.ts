// Text 사이즈 타입
export type TextSize = 'S' | 'M' | 'L' | 'XL';

// Text 사이즈 프리셋
export const TEXT_SIZE_PRESETS = {
  S: { fontSize: 16 },
  M: { fontSize: 32 },
  L: { fontSize: 64 },
  XL: { fontSize: 100 },
} as const;
