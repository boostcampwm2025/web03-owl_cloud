'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';

import {
  sharpCornerIcon,
  roundedCornerIcon,
} from '@/assets/icons/whiteboard/common';

export type EdgeType = 'sharp' | 'round';

interface EdgesSectionProps {
  edgeType: EdgeType;
  onChange: (type: EdgeType) => void;
}

export default function EdgesSection({
  edgeType,
  onChange,
}: EdgesSectionProps) {
  const options = [
    { value: 'sharp', label: '', icon: sharpCornerIcon },
    { value: 'round', label: '', icon: roundedCornerIcon },
  ];

  return (
    <Section title="Edges">
      <ButtonGroup
        label=""
        options={options}
        value={edgeType}
        onChange={(val) => onChange(val as EdgeType)}
      />
    </Section>
  );
}
