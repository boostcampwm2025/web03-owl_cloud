'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import Slider from '@/components/whiteboard/sidebar/ui/Slider';

interface OpacitySectionProps {
  // 0 ~ 1 사이의 값
  opacity: number;
  onChange: (opacity: number) => void;
}

export default function OpacitySection({
  opacity,
  onChange,
}: OpacitySectionProps) {
  // 표시는 0~100, 실제 데이터는 0~1
  const displayValue = Math.round(opacity * 100);

  const handleChange = (val: number) => {
    onChange(val / 100);
  };

  return (
    <Section title="Opacity">
      <Slider
        label=""
        min={0}
        max={100}
        step={1}
        value={displayValue}
        onChange={handleChange}
      />
    </Section>
  );
}
