// Drawing 사이즈 타입
export type DrawingSize = 'S' | 'M' | 'L';

// Drawing 사이즈 프리셋
export const DRAWING_SIZE_PRESETS = {
  S: { strokeWidth: 4 },
  M: { strokeWidth: 12 },
  L: { strokeWidth: 20 },
} as const;
