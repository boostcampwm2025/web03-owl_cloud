'use client';

import { useState } from 'react';
import Konva from 'konva';

import { Rect, Ellipse, Line } from 'react-konva';
import { ShapeItem as ShapeItemType } from '@/types/whiteboard';
import { useItemAnimation } from '@/hooks/useItemAnimation';

interface ShapeItemProps {
  shapeItem: ShapeItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;

  onSelect: () => void;
  onChange: (newAttrs: Partial<ShapeItemType>) => void;

  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;

  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function ShapeItem({
  shapeItem,
  isDraggable,
  isListening,
  isSelected,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: ShapeItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const isCircle = shapeItem.shapeType === 'circle';
  const displayX = isCircle ? shapeItem.x + shapeItem.width / 2 : shapeItem.x;
  const displayY = isCircle ? shapeItem.y + shapeItem.height / 2 : shapeItem.y;

  // 애니메이션 훅
  const shapeRef = useItemAnimation({
    x: displayX,
    y: displayY,
    width: shapeItem.width,
    height: shapeItem.height,
    isSelected,
    isDragging,
  });

  // 다각형 점 좌표
  let points: number[] = [];
  // w : 너비
  // h : 높이
  const w = shapeItem.width;
  const h = shapeItem.height;

  // 모서리 둥글기 여부
  const isRoundEdge = !!shapeItem.cornerRadius && shapeItem.cornerRadius > 0;

  const commonProps = {
    id: shapeItem.id,
    draggable: isDraggable,
    listening: isListening,
    x: displayX,
    y: displayY,
    rotation: shapeItem.rotation,
    fill: shapeItem.fill,
    stroke: shapeItem.stroke,
    strokeWidth: shapeItem.strokeWidth,

    opacity: shapeItem.opacity ?? 1,
    dash: shapeItem.dash,

    // 모서리 둥글기 설정 : round - 둥근 모서리 / miter - 각진 모서리
    lineJoin: (isRoundEdge ? 'round' : 'miter') as 'round' | 'miter',
    lineCap: 'round' as const,

    onMouseDown: onSelect,
    onTouchStart: onSelect,
    onMouseEnter: onMouseEnter,
    onMouseLeave: onMouseLeave,
    onDragStart: () => {
      setIsDragging(true);
      onDragStart?.();
    },

    // 이동 후 바뀐 위치 좌표 저장(드래그 끝난 이후 도형의 위치 좌표)
    // 위치 조정
    // 원형 : 원형 도형의 경우 중심점 기준이므로 보정 필요
    // 기타 도형 : 좌상단 기준이므로 보정 불필요
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false);

      let newX = e.target.x();
      let newY = e.target.y();

      if (isCircle) {
        // 원인 경우 중심점 좌표에서 반지름만큼 빼서 좌표 보정
        newX -= shapeItem.width / 2;
        newY -= shapeItem.height / 2;
      }

      onChange({ x: newX, y: newY });
      onDragEnd?.();
    },

    // 도형 조절 : 크기 조절 및 회전
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // 크기 보정
      // scale은 변형 시 임시로 크기를 조절하는 값이므로
      // 실제 크기 조절 시에는 원래 크기에 scale 값을 곱한 후
      // 다시 scale을 1로 초기화해야 함
      node.scaleX(1);
      node.scaleY(1);

      // 실제 크기 계산(크기 / 높이)
      const newWidth = Math.max(5, shapeItem.width * scaleX);
      const newHeight = Math.max(5, shapeItem.height * scaleY);

      // 크기 조절 후 위치 보정
      let newX = node.x();
      let newY = node.y();

      // 원형 도형인 경우 중심점 기준이므로 위치 보정 필요(위의 onDragEnd 로직 참고)
      if (isCircle) {
        newX -= newWidth / 2;
        newY -= newHeight / 2;
      }

      onChange({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });
    },
  };

  if (shapeItem.shapeType === 'rect') {
    return (
      <Rect
        {...commonProps}
        ref={shapeRef as React.RefObject<Konva.Rect>}
        width={shapeItem.width}
        height={shapeItem.height}
        cornerRadius={shapeItem.cornerRadius}
      />
    );
  }

  if (shapeItem.shapeType === 'circle') {
    return (
      <Ellipse
        {...commonProps}
        ref={shapeRef as React.RefObject<Konva.Ellipse>}
        radiusX={shapeItem.width / 2}
        radiusY={shapeItem.height / 2}
      />
    );
  }

  if (shapeItem.shapeType === 'triangle') points = [w / 2, 0, w, h, 0, h];
  if (shapeItem.shapeType === 'diamond')
    points = [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2];
  if (shapeItem.shapeType === 'pentagon')
    points = [w / 2, 0, w, h * 0.38, w * 0.82, h, w * 0.18, h, 0, h * 0.38];

  return (
    <Line
      {...commonProps}
      points={points}
      closed={true}
      width={w}
      height={h}
      ref={shapeRef as React.RefObject<Konva.Line>}
    />
  );
}
