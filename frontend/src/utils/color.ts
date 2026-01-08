import { COLOR_NAMES } from '@/constants/colors';

export const getColorName = (color: string): string => {
  if (COLOR_NAMES[color]) return COLOR_NAMES[color];
  return color;
};
