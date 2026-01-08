'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { PanelProps } from '@/types/whiteboardUI';

import {
  CircleIcon,
  TriangleIcon,
  SquareIcon,
  DiamondIcon,
  PentagonIcon,
} from '@/assets/icons/whiteboard';

export default function ShapePanel({ selectedTool, onSelect }: PanelProps) {
  const commonProps = {
    bgColor: 'bg-white',
    activeBgColor: 'bg-sky-100 text-sky-600',
  };

  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      <NavButton
        icon={CircleIcon}
        label="원"
        isActive={selectedTool === 'circle'}
        onClick={() => onSelect('circle')}
        {...commonProps}
      />
      <NavButton
        icon={TriangleIcon}
        label="삼각형"
        isActive={selectedTool === 'triangle'}
        onClick={() => onSelect('triangle')}
        {...commonProps}
      />
      <NavButton
        icon={SquareIcon}
        label="사각형"
        isActive={selectedTool === 'rectangle'}
        onClick={() => onSelect('rectangle')}
        {...commonProps}
      />
      <NavButton
        icon={DiamondIcon}
        label="다이아몬드"
        isActive={selectedTool === 'diamond'}
        onClick={() => onSelect('diamond')}
        {...commonProps}
      />
      <NavButton
        icon={PentagonIcon}
        label="오각형"
        isActive={selectedTool === 'pentagon'}
        onClick={() => onSelect('pentagon')}
        {...commonProps}
      />
    </div>
  );
}
