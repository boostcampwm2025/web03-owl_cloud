'use client';

import { useState } from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import { usePointsAnimation } from '@/hooks/useItemAnimation';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import type { DrawingItem as DrawingItemType } from '@/types/whiteboard';

interface DrawingItemProps {
  drawingItem: DrawingItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (changes: Partial<DrawingItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

export default function DrawingItem({
  drawingItem,
  isDraggable,
  isListening,
  isSelected,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DrawingItemProps) {
  const { isInteractive } = useItemInteraction();

  const [isDragging, setIsDragging] = useState(false);
  const selectedIds = useWhiteboardLocalStore((state) => state.selectedIds);
  const isMultiSelected =
    selectedIds.length > 1 && selectedIds.includes(drawingItem.id);

  const ref = usePointsAnimation({
    points: drawingItem.points,
    isDragging,
    isSelected,
  });

  return (
    <Line
      {...drawingItem}
      ref={ref as React.RefObject<Konva.Line>}
      id={drawingItem.id}
      name="whiteboard-item"
      draggable={isDraggable}
      listening={isListening}
      hitStrokeWidth={30}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      strokeScaleEnabled={true}
      onMouseDown={(e) => isInteractive && onSelect(e)}
      onTouchStart={(e) => isInteractive && onSelect(e)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={() => {
        if (!isInteractive) return;
        setIsDragging(true);
        onDragStart?.();
      }}
      onDragMove={(e) => {
        if (!isInteractive) return;
        const pos = e.target.position();
        onDragMove?.(pos.x, pos.y);
      }}
      onDragEnd={(e) => {
        if (!isInteractive) return;
        setIsDragging(false);

        if (isMultiSelected) {
          e.target.position({ x: 0, y: 0 });
          onDragEnd?.();
          return;
        }

        const pos = e.target.position();
        const newPoints = drawingItem.points.map((p, i) =>
          i % 2 === 0 ? p + pos.x : p + pos.y,
        );

        e.target.position({ x: 0, y: 0 });

        onChange({
          points: newPoints,
        });
        onDragEnd?.();
      }}
      onTransform={(e) => {
        if (!isInteractive) return;
        const node = e.target;

        if (node.getClassName() !== 'Line') return;
        const lineNode = node as Konva.Line;

        const scaleX = lineNode.scaleX();
        const scaleY = lineNode.scaleY();

        // 현재 points를 가져와서 scale 적용
        const currentPoints = lineNode.points();
        const newPoints = currentPoints.map((p, i) =>
          i % 2 === 0 ? p * scaleX : p * scaleY,
        );

        lineNode.points(newPoints);
        lineNode.scaleX(1);
        lineNode.scaleY(1);
      }}
      onTransformEnd={(e) => {
        if (!isInteractive) return;
        // 멀티 선택 시에는 ItemTransformer에서 일괄 처리
        if (isMultiSelected) return;

        const node = e.target;

        if (node.getClassName() !== 'Line') return;
        const lineNode = node as Konva.Line;

        // 기준 x,y 변화 반영(transform 시 밀림)
        const pos = lineNode.position();
        const currentPoints = lineNode.points();

        // 기준점이 변했으면 points에 반영
        const adjustedPoints = currentPoints.map((p, i) =>
          i % 2 === 0 ? p + pos.x : p + pos.y,
        );

        // 기준점 리셋
        lineNode.position({ x: 0, y: 0 });

        onChange({
          points: adjustedPoints,
          rotation: lineNode.rotation(),
        });
      }}
    />
  );
}
