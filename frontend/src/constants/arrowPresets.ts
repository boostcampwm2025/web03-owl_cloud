// Arrow 사이즈 타입
export type ArrowSize = 'S' | 'M' | 'L';

// Arrow 스타일 타입
export type ArrowStyle = 'straight' | 'curved';

// Arrow 사이즈 프리셋
export const ARROW_SIZE_PRESETS = {
  S: { strokeWidth: 2, pointerSize: 8 },
  M: { strokeWidth: 4, pointerSize: 14 },
  L: { strokeWidth: 10, pointerSize: 40 },
} as const;

// Arrow 스타일 프리셋
export const ARROW_STYLE_PRESETS = {
  straight: 0,
  curved: 0.4,
} as const;
