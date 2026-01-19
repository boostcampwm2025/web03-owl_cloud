'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';
import type { ArrowSize, ArrowStyle } from '../panels/arrowPresets';

// Arrow 스타일 설정 section
interface ArrowStyleSectionProps {
  size: ArrowSize;
  style: ArrowStyle;
  onChangeSize: (size: ArrowSize) => void;
  onChangeStyle: (style: ArrowStyle) => void;
}

export default function ArrowStyleSection({
  size,
  style,
  onChangeSize,
  onChangeStyle,
}: ArrowStyleSectionProps) {
  return (
    <Section title="Style">
      <div className="flex flex-col gap-3">
        <ButtonGroup
          label="Size"
          options={[
            { value: 'S', label: 'S' },
            { value: 'M', label: 'M' },
            { value: 'L', label: 'L' },
          ]}
          value={size}
          onChange={onChangeSize}
        />
        <ButtonGroup
          label="Line"
          options={[
            { value: 'straight', label: 'Straight' },
            { value: 'curved', label: 'Curved' },
          ]}
          value={style}
          onChange={onChangeStyle}
        />
      </div>
    </Section>
  );
}
