'use client';

import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';

import { Rect, Ellipse, Line, Group, Text } from 'react-konva';
import { ShapeItem as ShapeItemType } from '@/types/whiteboard';
import { useItemAnimation } from '@/hooks/useItemAnimation';

interface ShapeItemProps {
  shapeItem: ShapeItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;

  onSelect: () => void;
  onChange: (newAttrs: Partial<ShapeItemType>) => void;
  onDblClick?: () => void;

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
  onDblClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: ShapeItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const lastTransformRef = useRef<number>(0);

  const isCircle = shapeItem.shapeType === 'circle';
  const width = shapeItem.width || 0;
  const height = shapeItem.height || 0;
  const x = shapeItem.x || 0;
  const y = shapeItem.y || 0;

  const displayX = isCircle ? x + width / 2 : x;
  const displayY = isCircle ? y + height / 2 : y;

  // 애니메이션 훅
  const shapeRef = useItemAnimation({
    x: displayX,
    y: displayY,
    width: shapeItem.width,
    height: shapeItem.height,
    isSelected,
    isDragging,
  });

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      if (!shapeItem.text) return;

      const group = e.target as Konva.Group;
      const groupScaleX = group.scaleX();
      const groupScaleY = group.scaleY();

      // 회전만 하는 경우 넘김(계산 안함)
      if (
        Math.abs(groupScaleX - 1) < 0.001 &&
        Math.abs(groupScaleY - 1) < 0.001
      )
        return;

      // 스로틀링, 30ms마다 업데이트(텍스트 많으면 성능 문제 있음)
      const now = Date.now();
      if (now - lastTransformRef.current < 30) return;
      lastTransformRef.current = now;

      const textNode = group.findOne('Text') as Konva.Text;
      if (!textNode) return;

      textNode.scaleX(1 / groupScaleX);
      textNode.scaleY(1 / groupScaleY);

      const newWidth = shapeItem.width * 0.8 * groupScaleX;
      const newHeight = shapeItem.height * groupScaleY;
      textNode.width(newWidth);
      textNode.height(newHeight);

      const offsetX = (shapeItem.width - shapeItem.width * 0.8) / 2;

      const isCircle = shapeItem.shapeType === 'circle';
      if (isCircle) {
        textNode.x(-shapeItem.width / 2 + offsetX);
        textNode.y(-shapeItem.height / 2);
      } else {
        textNode.x(offsetX);
        textNode.y(0);
      }
    },
    [shapeItem.text, shapeItem.width, shapeItem.height, shapeItem.shapeType],
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>, isCircleShape: boolean) => {
      const node = e.target as Konva.Group;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const newWidth = Math.max(5, shapeItem.width * scaleX);
      const newHeight = Math.max(5, shapeItem.height * scaleY);

      let newX = node.x();
      let newY = node.y();

      if (isCircleShape) {
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

      // 텍스트 노드 스케일 리셋
      if (shapeItem.text) {
        const textNode = node.findOne('Text') as Konva.Text;
        if (textNode) {
          textNode.scaleX(1);
          textNode.scaleY(1);
        }
      }
    },
    [shapeItem.width, shapeItem.height, shapeItem.text, onChange],
  );

  // 공통 Drag 핸들러
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, isCircleShape: boolean) => {
      setIsDragging(false);

      let newX = e.target.x();
      let newY = e.target.y();

      if (isCircleShape) {
        newX -= shapeItem.width / 2;
        newY -= shapeItem.height / 2;
      }

      onChange({ x: newX, y: newY });
      onDragEnd?.();
    },
    [shapeItem.width, shapeItem.height, onChange, onDragEnd],
  );

  const w = shapeItem.width || 0;
  const h = shapeItem.height || 0;
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
    lineJoin: (isRoundEdge ? 'round' : 'miter') as 'round' | 'miter',
    lineCap: 'round' as const,
    onMouseDown: onSelect,
    onTouchStart: onSelect,
    onDblClick: onDblClick,
    onMouseEnter: onMouseEnter,
    onMouseLeave: onMouseLeave,
  };

  // 텍스트 렌더링
  const renderText = () => {
    if (!shapeItem.text) return null;

    const textWidth = width * 0.8;
    const offsetX = (width - textWidth) / 2;

    return (
      <Text
        text={shapeItem.text}
        fontSize={shapeItem.fontSize || 16}
        fontFamily={shapeItem.fontFamily || 'Arial'}
        fontStyle={shapeItem.fontStyle || 'normal'}
        textDecoration={shapeItem.textDecoration || ''}
        fill={shapeItem.textColor || '#000000'}
        align={shapeItem.textAlign || 'center'}
        verticalAlign="middle"
        width={textWidth}
        height={height}
        x={isCircle ? -width / 2 + offsetX : offsetX}
        y={isCircle ? -height / 2 : 0}
        listening={false}
        wrap="word"
        ellipsis={false}
        lineHeight={1.2}
        padding={4}
        scaleX={1}
        scaleY={1}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={0}
      />
    );
  };

  const groupProps = {
    ...commonProps,
    ref: shapeRef as React.RefObject<Konva.Group>,
    onDragStart: handleDragStart,
    onTransform: shapeItem.text ? handleTransform : undefined,
  };

  if (shapeItem.shapeType === 'rect') {
    return (
      <Group
        {...groupProps}
        onDragEnd={(e) => handleDragEnd(e, false)}
        onTransformEnd={(e) => handleTransformEnd(e, false)}
      >
        <Rect
          width={width}
          height={height}
          fill={shapeItem.fill}
          stroke={shapeItem.stroke}
          strokeWidth={shapeItem.strokeWidth}
          cornerRadius={shapeItem.cornerRadius}
          opacity={shapeItem.opacity ?? 1}
          dash={shapeItem.dash}
          lineJoin={(isRoundEdge ? 'round' : 'miter') as 'round' | 'miter'}
          lineCap="round"
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
        />
        {renderText()}
      </Group>
    );
  }

  if (shapeItem.shapeType === 'circle') {
    return (
      <Group
        {...groupProps}
        onDragEnd={(e) => handleDragEnd(e, true)}
        onTransformEnd={(e) => handleTransformEnd(e, true)}
      >
        <Ellipse
          radiusX={width / 2}
          radiusY={height / 2}
          fill={shapeItem.fill}
          stroke={shapeItem.stroke}
          strokeWidth={shapeItem.strokeWidth}
          opacity={shapeItem.opacity ?? 1}
          dash={shapeItem.dash}
          lineJoin={(isRoundEdge ? 'round' : 'miter') as 'round' | 'miter'}
          lineCap="round"
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
        />
        {renderText()}
      </Group>
    );
  }

  // 다각형 points 계산
  let points: number[] = [];
  if (shapeItem.shapeType === 'triangle') points = [w / 2, 0, w, h, 0, h];
  if (shapeItem.shapeType === 'diamond')
    points = [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2];
  if (shapeItem.shapeType === 'pentagon')
    points = [w / 2, 0, w, h * 0.38, w * 0.82, h, w * 0.18, h, 0, h * 0.38];

  if (points.some((p) => !isFinite(p))) return null;

  return (
    <Group
      {...groupProps}
      onDragEnd={(e) => handleDragEnd(e, false)}
      onTransformEnd={(e) => handleTransformEnd(e, false)}
    >
      <Line
        points={points}
        closed={true}
        width={w}
        height={h}
        fill={shapeItem.fill}
        stroke={shapeItem.stroke}
        strokeWidth={shapeItem.strokeWidth}
        opacity={shapeItem.opacity ?? 1}
        dash={shapeItem.dash}
        lineJoin={(isRoundEdge ? 'round' : 'miter') as 'round' | 'miter'}
        lineCap="round"
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={0}
      />
      {renderText()}
    </Group>
  );
}
