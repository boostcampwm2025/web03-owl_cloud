'use client';

import { useState } from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import type { ArrowItem, WhiteboardItem } from '@/types/whiteboard';
import CustomArrowHead from './CustomArrowHead';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import { useCursorStyle } from '@/hooks/useCursorStyle';
import { usePointsAnimation } from '@/hooks/useItemAnimation';

interface CustomArrowProps {
  item: ArrowItem;
  onSelect: (id: string) => void;
  onChange: (newAttributes: Partial<WhiteboardItem>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onArrowDblClick?: (id: string) => void;
  isSelected: boolean;
}

export default function CustomArrow({
  item,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onArrowDblClick,
  isSelected,
}: CustomArrowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startHeadType = item.startHeadType ?? 'none';
  const endHeadType = item.endHeadType ?? 'triangle';

  // 아이템 인터랙션 상태
  const { isInteractive, isDraggable, isListening } = useItemInteraction();

  // 커서 스타일 훅
  const { handleMouseEnter, handleMouseLeave } = useCursorStyle('move');

  // 애니메이션 훅
  const groupRef = usePointsAnimation({
    points: item.points,
    isDragging,
    isSelected,
  });

  const points = item?.points;
  if (!points || !Array.isArray(points) || points.length < 2) {
    return null;
  }

  const n = points.length;

  // 시작점과 각도 계산
  const startX = points[0];
  const startY = points[1];
  const nextX = points[2] ?? points[0];
  const nextY = points[3] ?? points[1];
  const dx1 = nextX - startX;
  const dy1 = nextY - startY;
  const startAngle = Math.atan2(dy1, dx1);

  // 끝점과 각도 계산
  const endX = points[n - 2];
  const endY = points[n - 1];
  const prevX = points[n - 4] ?? endX;
  const prevY = points[n - 3] ?? endY;
  const dx2 = endX - prevX;
  const dy2 = endY - prevY;
  const endAngle = Math.atan2(dy2, dx2);

  // Line(화살표 선)을 화살표 머리 길이만큼 뒤에서 시작
  const adjustedPoints = [...points];
  const pointerLength = item.pointerLength;

  // 시작점 조정 (triangle, doubleChevron)
  if (
    (startHeadType === 'triangle' || startHeadType === 'doubleChevron') &&
    n >= 4
  ) {
    const distance = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    if (distance > pointerLength) {
      const ratio = pointerLength / distance;
      adjustedPoints[0] = points[0] + dx1 * ratio;
      adjustedPoints[1] = points[1] + dy1 * ratio;
    }
  }

  // 끝점 조정 (triangle, doubleChevron)
  if (
    (endHeadType === 'triangle' || endHeadType === 'doubleChevron') &&
    n >= 4
  ) {
    const distance = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (distance > pointerLength) {
      const ratio = pointerLength / distance;
      adjustedPoints[n - 2] = points[n - 2] - dx2 * ratio;
      adjustedPoints[n - 1] = points[n - 1] - dy2 * ratio;
    }
  }

  return (
    <Group
      ref={groupRef as React.RefObject<Konva.Group>}
      id={item.id}
      name="arrow-group"
      draggable={isDraggable}
      listening={isListening}
      onMouseDown={() => isInteractive && onSelect(item.id)}
      onTouchStart={() => isInteractive && onSelect(item.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDblClick={() => {
        if (!isInteractive) return;
        onArrowDblClick?.(item.id);
      }}
      onDblTap={() => {
        if (!isInteractive) return;
        onArrowDblClick?.(item.id);
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
        const newPoints = item.points.map((p, i) =>
          i % 2 === 0 ? p + pos.x : p + pos.y,
        );
        e.target.position({ x: 0, y: 0 });

        const updates: Partial<ArrowItem> = { points: newPoints };
        if (item.startBinding) updates.startBinding = null;
        if (item.endBinding) updates.endBinding = null;

        onChange(updates);
        onDragEnd?.();
      }}
    >
      {/* 화살표 선 */}
      <Line
        points={adjustedPoints}
        stroke={item.stroke}
        strokeWidth={item.strokeWidth}
        hitStrokeWidth={30}
        tension={item.tension}
        lineCap="round"
        lineJoin="round"
      />

      {/* 시작점 머리 (Tail) */}
      {startHeadType !== 'none' && (
        <CustomArrowHead
          x={startX}
          y={startY}
          angle={startAngle + Math.PI} // 반대 방향
          length={item.pointerLength}
          width={item.pointerWidth}
          stroke={item.stroke}
          strokeWidth={item.strokeWidth}
          type={startHeadType}
          chevronSpacing={item.chevronSpacing}
        />
      )}

      {/* 끝점 머리 (Head) */}
      {endHeadType !== 'none' && (
        <CustomArrowHead
          x={endX}
          y={endY}
          angle={endAngle}
          length={item.pointerLength}
          width={item.pointerWidth}
          stroke={item.stroke}
          strokeWidth={item.strokeWidth}
          type={endHeadType}
          chevronSpacing={item.chevronSpacing}
        />
      )}
    </Group>
  );
}
