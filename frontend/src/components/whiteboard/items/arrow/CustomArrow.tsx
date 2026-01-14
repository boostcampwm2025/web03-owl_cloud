'use client';

import Konva from 'konva';
import { Group, Line } from 'react-konva';
import type { ArrowItem, WhiteboardItem } from '@/types/whiteboard';
import CustomArrowHead from './CustomArrowHead';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import { useCursorStyle } from '@/hooks/useCursorStyle';

interface CustomArrowProps {
  item: ArrowItem;
  onSelect: (id: string) => void;
  onChange: (newAttributes: Partial<WhiteboardItem>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onArrowDblClick?: (id: string) => void;
}

export default function CustomArrow({
  item,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onArrowDblClick,
}: CustomArrowProps) {
  const startHeadType = item.startHeadType ?? 'none';
  const endHeadType = item.endHeadType ?? 'triangle';

  // 아이템 인터랙션 상태
  const { isInteractive, isEraserMode, isDraggable, isListening } =
    useItemInteraction();

  // 커서 스타일 훅
  const { handleMouseEnter, handleMouseLeave } = useCursorStyle('move');

  const points = item.points;

  // 시작점과 각도 계산
  const startX = points[0];
  const startY = points[1];
  const nextX = points[2] ?? points[0];
  const nextY = points[3] ?? points[1];
  const startAngle = Math.atan2(nextY - startY, nextX - startX);

  // 끝점과 각도 계산
  const endX = points[points.length - 2];
  const endY = points[points.length - 1];
  const prevX = points[points.length - 4] ?? endX;
  const prevY = points[points.length - 3] ?? endY;
  const endAngle = Math.atan2(endY - prevY, endX - prevX);

  return (
    <Group
      id={item.id}
      draggable={isDraggable}
      listening={isListening}
      onMouseDown={() => isInteractive && !isEraserMode && onSelect(item.id)}
      onTouchStart={() => isInteractive && !isEraserMode && onSelect(item.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDblClick={() => {
        if (!isInteractive || isEraserMode) return;
        onArrowDblClick?.(item.id);
      }}
      onDragStart={() => {
        if (!isInteractive || isEraserMode) return;
        onDragStart?.();
      }}
      onDragEnd={(e) => {
        if (!isInteractive || isEraserMode) return;
        const pos = e.target.position();
        const newPoints = item.points.map((p, i) =>
          i % 2 === 0 ? p + pos.x : p + pos.y,
        );
        e.target.position({ x: 0, y: 0 });
        onChange({ points: newPoints });
        onDragEnd?.();
      }}
    >
      {/* 화살표 선 */}
      <Line
        points={item.points}
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
