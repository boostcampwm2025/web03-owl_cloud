'use client';

import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';
import type { TextSize } from '@/constants/textPresets';

// Text 크기 설정 section
interface TextSizeSectionProps {
  size: TextSize;
  onChangeSize: (size: TextSize) => void;
}

export default function TextSizeSection({
  size,
  onChangeSize,
}: TextSizeSectionProps) {
  return (
    <ButtonGroup
      label="Size"
      options={[
        { value: 'S', label: 'S' },
        { value: 'M', label: 'M' },
        { value: 'L', label: 'L' },
        { value: 'XL', label: 'XL' },
      ]}
      value={size}
      onChange={onChangeSize}
    />
  );
}
