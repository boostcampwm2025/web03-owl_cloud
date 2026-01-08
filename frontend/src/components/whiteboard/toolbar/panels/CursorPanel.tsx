'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { PanelProps } from '@/types/whiteboardUI';

import { CursorIcon, HandIcon } from '@/assets/icons/whiteboard';

export default function CursorPanel({ selectedTool, onSelect }: PanelProps) {
  const commonProps = {
    bgColor: 'bg-white',
    activeBgColor: 'bg-sky-100 text-sky-600',
  };

  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      <NavButton
        icon={CursorIcon}
        label="선택 (Select)"
        isActive={selectedTool === 'select'}
        onClick={() => onSelect('select')}
        {...commonProps}
      />
      <NavButton
        icon={HandIcon}
        label="화면 이동 (Move)"
        isActive={selectedTool === 'move'}
        onClick={() => onSelect('move')}
        {...commonProps}
      />
    </div>
  );
}
