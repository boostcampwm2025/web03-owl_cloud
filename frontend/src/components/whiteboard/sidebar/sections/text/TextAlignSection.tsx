'use client';

import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';
import type { TextAlignment } from '@/types/whiteboard/base';
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
} from '@/assets/icons/whiteboard/text';

// Text 정렬 설정 section
interface TextAlignSectionProps {
  align: TextAlignment;
  onChangeAlign: (align: TextAlignment) => void;
}

export default function TextAlignSection({
  align,
  onChangeAlign,
}: TextAlignSectionProps) {
  return (
    <ButtonGroup
      label="Align"
      options={[
        { value: 'left', icon: AlignLeftIcon },
        { value: 'center', icon: AlignCenterIcon },
        { value: 'right', icon: AlignRightIcon },
      ]}
      value={align}
      onChange={onChangeAlign}
    />
  );
}
