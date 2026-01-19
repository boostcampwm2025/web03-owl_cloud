'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import ColorPicker from '@/components/whiteboard/sidebar/ui/ColorPicker';

// 배경 색상 설정 section
interface BackgroundColorSectionProps {
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

export default function BackgroundColorSection({
  color,
  onChange,
  allowTransparent = true,
}: BackgroundColorSectionProps) {
  return (
    <Section title="Background">
      <ColorPicker
        color={color}
        onChange={onChange}
        allowTransparent={allowTransparent}
      />
    </Section>
  );
}
