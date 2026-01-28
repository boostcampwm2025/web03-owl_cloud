'use client';

import { useState } from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import { usePointsAnimation } from '@/hooks/useItemAnimation';
import type { LineItem as LineItemType } from '@/types/whiteboard';

interface LineItemProps {
  lineItem: LineItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<LineItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onArrowDblClick?: (id: string) => void;
}

export default function LineItem({
  lineItem,
  isDraggable,
  isListening,
  isSelected,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
  onArrowDblClick,
}: LineItemProps) {
  const { isInteractive } = useItemInteraction();

  const [isDragging, setIsDragging] = useState(false);

  const ref = usePointsAnimation({
    points: lineItem.points,
    isDragging,
    isSelected,
  });

  return (
    <Line
      {...lineItem}
      ref={ref as React.RefObject<Konva.Line>}
      id={lineItem.id}
      draggable={isDraggable}
      listening={isListening}
      hitStrokeWidth={30}
      lineCap="round"
      lineJoin="round"
      onMouseDown={() => isInteractive && onSelect()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDblClick={() => {
        if (!isInteractive) return;
        onArrowDblClick?.(lineItem.id);
      }}
      onDragStart={() => {
        if (!isInteractive) return;
        setIsDragging(true);
        onDragStart?.();
      }}
      onDragEnd={(e) => {
        if (!isInteractive) return;
        setIsDragging(false);
        const pos = e.target.position();
        const newPoints = lineItem.points.map((p, i) =>
          i % 2 === 0 ? p + pos.x : p + pos.y,
        );
        e.target.position({ x: 0, y: 0 });
        onChange({ points: newPoints });
        onDragEnd?.();
      }}
    />
  );
}
