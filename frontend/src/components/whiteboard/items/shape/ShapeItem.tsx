'use client';

import Konva from 'konva';

import { Rect, Ellipse, Line } from 'react-konva';
import { ShapeItem as ShapeItemType } from '@/types/whiteboard';

interface ShapeItemProps {
  shapeItem: ShapeItemType;
  isDraggable: boolean;
  isListening: boolean;

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
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: ShapeItemProps) {
  // 다각형 점 좌표
  let points: number[] = [];
  // w : 너비
  // h : 높이
  const w = shapeItem.width;
  const h = shapeItem.height;
  const isCircle = shapeItem.shapeType === 'circle';

  const commonProps = {
    id: shapeItem.id,
    draggable: isDraggable,
    listening: isListening,
    x: isCircle ? shapeItem.x + shapeItem.width / 2 : shapeItem.x,
    y: isCircle ? shapeItem.y + shapeItem.height / 2 : shapeItem.y,
    rotation: shapeItem.rotation,
    fill: shapeItem.fill,
    stroke: shapeItem.stroke,
    strokeWidth: shapeItem.strokeWidth,
    onMouseDown: onSelect,
    onTouchStart: onSelect,
    onMouseEnter: onMouseEnter,
    onMouseLeave: onMouseLeave,
    onDragStart: onDragStart,

    // 이동 후 바뀐 위치 좌표 저장(드래그 끝난 이후 도형의 위치 좌표)
    // 위치 조정
    // 원형 : 원형 도형의 경우 중심점 기준이므로 보정 필요
    // 기타 도형 : 좌상단 기준이므로 보정 불필요
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      let newX = e.target.x();
      let newY = e.target.y();

      if (isCircle) {
        // 원인 경우 중심점 좌표에서 반지름만큼 빼서 좌표 보정
        newX -= shapeItem.width / 2;
        newY -= shapeItem.height / 2;
      }

      onChange({ x: newX, y: newY });
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
        width={shapeItem.width}
        height={shapeItem.height}
      />
    );
  }

  if (shapeItem.shapeType === 'circle') {
    return (
      <Ellipse
        {...commonProps}
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
    <Line {...commonProps} points={points} closed={true} width={w} height={h} />
  );
}
