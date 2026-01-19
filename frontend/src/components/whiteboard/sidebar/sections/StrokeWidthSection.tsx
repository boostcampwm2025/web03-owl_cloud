'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';
import Slider from '@/components/whiteboard/sidebar/ui/Slider';

interface StrokeWidthSectionProps {
  strokeWidth: number;
  onChange: (width: number) => void;
}

export default function StrokeWidthSection({
  strokeWidth,
  onChange,
}: StrokeWidthSectionProps) {
  const sizeOptions = [
    { label: 'S', value: 2 },
    { label: 'M', value: 4 },
    { label: 'L', value: 10 },
  ];

  return (
    <Section title="Border">
      <div className="flex items-end gap-3">
        {/* 프리셋 버튼 그룹 */}
        <div className="flex-1">
          <ButtonGroup
            label=""
            options={sizeOptions}
            value={strokeWidth}
            onChange={onChange}
          />
        </div>

        {/* 두께 슬라이더 */}
        <div className="flex-1">
          <Slider
            label="thickness"
            value={strokeWidth}
            min={0.5}
            max={20}
            step={0.1}
            onChange={onChange}
          />
        </div>
      </div>
    </Section>
  );
}
