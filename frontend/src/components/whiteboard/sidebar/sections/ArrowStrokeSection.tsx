'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import ColorPicker from '@/components/whiteboard/sidebar/ui/ColorPicker';

// Arrow 선 색상 설정 section
interface ArrowStrokeSectionProps {
  color: string;
  onChange: (color: string) => void;
}

export default function ArrowStrokeSection({
  color,
  onChange,
}: ArrowStrokeSectionProps) {
  return (
    <Section title="Color">
      <ColorPicker color={color} onChange={onChange} allowTransparent={false} />
    </Section>
  );
}
