'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { PanelProps } from '@/types/whiteboardUI';

import { TextBoxIcon } from '@/assets/icons/whiteboard';

export default function TextPanel({ selectedTool, onSelect }: PanelProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      <NavButton
        icon={TextBoxIcon}
        label="텍스트"
        isActive={selectedTool === 'text'}
        onClick={() => onSelect('text')}
        bgColor="bg-white"
        activeBgColor="bg-sky-100 text-sky-600"
      />
    </div>
  );
}
