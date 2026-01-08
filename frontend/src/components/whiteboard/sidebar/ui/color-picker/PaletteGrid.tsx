'use client';

import { FULL_PALETTE, NO_TRANSPARENT_PALETTE } from '@/constants/colors';

import { getColorName } from '@/utils/color';

import ColorButton from '@/components/whiteboard/sidebar/ui/color-picker/ColorButton';

// 색상 버튼 모음 컴포넌트(팔레트)
interface PaletteGridProps {
  currentColor: string;
  onChange: (color: string) => void;
  allowTransparent: boolean;
}

export default function PaletteGrid({
  currentColor,
  onChange,
  allowTransparent,
}: PaletteGridProps) {
  // palette : 투명 허용 여부에 따른 데이터 배열 선택
  const palette = allowTransparent ? FULL_PALETTE : NO_TRANSPARENT_PALETTE;

  return (
    <div className="grid grid-cols-5 gap-2">
      {palette.map((color) => (
        <ColorButton
          key={color}
          color={color}
          label={getColorName(color)}
          isSelected={currentColor === color}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
