'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';

import {
  lineSolidIcon,
  lineDashIcon,
  lineDottedIcon,
} from '@/assets/icons/whiteboard/common';

export type StrokeStyleType = 'solid' | 'dashed' | 'dotted';

interface StrokeStyleSectionProps {
  strokeStyle: StrokeStyleType;
  onChange: (style: StrokeStyleType) => void;
}

export default function StrokeStyleSection({
  strokeStyle,
  onChange,
}: StrokeStyleSectionProps) {
  const options = [
    { value: 'solid', label: '', icon: lineSolidIcon },
    { value: 'dashed', label: '', icon: lineDashIcon },
    { value: 'dotted', label: '', icon: lineDottedIcon },
  ];

  return (
    <Section title="Stroke style">
      <ButtonGroup
        label=""
        options={options}
        value={strokeStyle}
        onChange={(val) => onChange(val as StrokeStyleType)}
      />
    </Section>
  );
}
