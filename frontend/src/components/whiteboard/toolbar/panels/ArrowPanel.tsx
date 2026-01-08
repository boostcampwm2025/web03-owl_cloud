'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { PanelProps } from '@/types/whiteboardUI';

// ArrowRight -> / doubleArrow <-> / ChevronArrow >>
import {
  ArrowIcon,
  DoubleArrowIcon,
  ChevronArrowIcon,
} from '@/assets/icons/whiteboard';

export default function ArrowPanel({ selectedTool, onSelect }: PanelProps) {
  const commonProps = {
    bgColor: 'bg-white',
    activeBgColor: 'bg-sky-100 text-sky-600',
  };

  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      <NavButton
        icon={ArrowIcon}
        label="화살표"
        isActive={selectedTool === 'arrow'}
        onClick={() => onSelect('arrow')}
        {...commonProps}
      />
      <NavButton
        icon={DoubleArrowIcon}
        label="양방향 화살표"
        isActive={selectedTool === 'doubleArrow'}
        onClick={() => onSelect('doubleArrow')}
        {...commonProps}
      />
      <NavButton
        icon={ChevronArrowIcon}
        label="화살표 2개"
        isActive={selectedTool === 'chevronArrow'}
        onClick={() => onSelect('chevronArrow')}
        {...commonProps}
      />
    </div>
  );
}
