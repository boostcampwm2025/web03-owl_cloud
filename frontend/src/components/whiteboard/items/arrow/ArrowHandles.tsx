'use client';

import { Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { getControlPoints } from '@/utils/arrow';
import { useCursorStyle } from '@/hooks/useCursorStyle';
import type { ArrowItem } from '@/types/whiteboard';

interface ArrowHandlesProps {
  arrow: ArrowItem;
  selectedHandleIndex: number | null;
  onHandleClick: (e: KonvaEventObject<MouseEvent>, index: number) => void;
  onStartDrag: (e: KonvaEventObject<DragEvent>) => void;
  onControlPointDrag: (
    pointIndex: number,
    e: KonvaEventObject<DragEvent>,
  ) => void;
  onEndDrag: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: () => void;
  draggingPoints: number[] | null;
}

export default function ArrowHandles({
  arrow,
  selectedHandleIndex,
  onHandleClick,
  onStartDrag,
  onControlPointDrag,
  onEndDrag,
  onDragEnd,
  draggingPoints,
}: ArrowHandlesProps) {
  // 드래그 중이면 draggingPoints 사용, 아니면 arrow.points 사용
  const points = draggingPoints || arrow.points;
  const controlPoints = getControlPoints(points);
  const startPoint = { x: points[0], y: points[1] };
  const endPoint = {
    x: points[points.length - 2],
    y: points[points.length - 1],
  };

  const { handleMouseEnter, handleMouseLeave } = useCursorStyle('pointer');

  return (
    <>
      {/* 시작 핸들 */}
      <Circle
        x={startPoint.x}
        y={startPoint.y}
        radius={6}
        fill="#ffffff"
        stroke="#0369A1"
        strokeWidth={2}
        draggable
        onDragMove={onStartDrag}
        onDragEnd={onDragEnd}
        onClick={(e) => onHandleClick(e, 0)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* 중간점 핸들  */}
      {controlPoints.map((point, idx) => {
        const isHandleSelected = selectedHandleIndex === point.index;
        return (
          <Circle
            key={`control-${arrow.id}-${idx}`}
            x={point.x}
            y={point.y}
            radius={6}
            fill={isHandleSelected ? '#B8E6FE' : '#ffffff'}
            stroke="#B8E6FE"
            strokeWidth={isHandleSelected ? 3 : 2}
            draggable
            onDragMove={(e) => onControlPointDrag(point.index, e)}
            onDragEnd={onDragEnd}
            onClick={(e) => onHandleClick(e, point.index)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}

      {/* 끝점 핸들 */}
      <Circle
        x={endPoint.x}
        y={endPoint.y}
        radius={6}
        fill="#ffffff"
        stroke="#0369A1"
        strokeWidth={2}
        draggable
        onDragMove={onEndDrag}
        onDragEnd={onDragEnd}
        onClick={(e) => onHandleClick(e, points.length - 2)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </>
  );
}
