'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { PanelProps } from '@/types/whiteboardUI';

import { LineIcon } from '@/assets/icons/whiteboard';

export default function LinePanel({ selectedTool, onSelect }: PanelProps) {
  const commonProps = {
    bgColor: 'bg-white',
    activeBgColor: 'bg-sky-100 text-sky-600',
  };

  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      <NavButton
        icon={LineIcon}
        label="직선"
        isActive={selectedTool === 'line'}
        onClick={() => onSelect('line')}
        {...commonProps}
      />
    </div>
  );
}
