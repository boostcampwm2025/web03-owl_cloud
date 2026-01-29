'use client';

import { useState, useCallback } from 'react';
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
  onDragMove?: (x: number, y: number) => void;
  onTransformMove?: (
    x: number,
    y: number,
    w: number,
    h: number,
    rotation: number,
  ) => void;
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
  onDragMove,
  onTransformMove,
  onDragEnd,
}: ShapeItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  const width = shapeItem.width || 0;
  const height = shapeItem.height || 0;
  const x = shapeItem.x || 0;
  const y = shapeItem.y || 0;

  const displayX = x;
  const displayY = y;

  // 애니메이션 훅
  const shapeRef = useItemAnimation({
    x: displayX,
    y: displayY,
    width: shapeItem.width,
    height: shapeItem.height,
    isSelected,
    isDragging: isDragging || isTransforming,
  });

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const group = e.target as Konva.Group;
      const groupScaleX = group.scaleX();
      const groupScaleY = group.scaleY();

      const newWidth = Math.max(5, shapeItem.width * groupScaleX);
      const newHeight = Math.max(5, shapeItem.height * groupScaleY);

      const newX = group.x();
      const newY = group.y();
      const newRotation = group.rotation();

      onTransformMove?.(newX, newY, newWidth, newHeight, newRotation);

      // 2. 텍스트 자동 크기 조절 (있는 경우)
      if (!shapeItem.text) return;

      // 회전만 하는 경우 넘김(계산 안함)
      if (
        Math.abs(groupScaleX - 1) < 0.001 &&
        Math.abs(groupScaleY - 1) < 0.001
      )
        return;

      const textNode = group.findOne('Text') as Konva.Text;
      if (!textNode) return;

      textNode.scaleX(1 / groupScaleX);
      textNode.scaleY(1 / groupScaleY);

      const textWidth = shapeItem.width * 0.8 * groupScaleX;
      const textHeight = shapeItem.height * groupScaleY;
      textNode.width(textWidth);
      textNode.height(textHeight);

      const offsetX = (shapeItem.width - shapeItem.width * 0.8) / 2;

      textNode.x(offsetX);
      textNode.y(0);
    },
    [shapeItem.text, shapeItem.width, shapeItem.height, onTransformMove],
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      setIsTransforming(false);
      const node = e.target as Konva.Group;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const newWidth = Math.max(5, shapeItem.width * scaleX);
      let newHeight = Math.max(5, shapeItem.height * scaleY);

      // 텍스트 있으면 텍스트 노드 크기에 맞춰 높이 조절
      if (shapeItem.text) {
        const textNode = node.findOne('Text') as Konva.Text;
        if (textNode) {
          const originalWidth = textNode.width();
          const originalHeight = textNode.height();
          const textWidth = newWidth * 0.8;

          textNode.width(textWidth);
          // @ts-expect-error 라이브러리 타입 정의에는 없지만 실제로 'auto' 값을 허용함
          textNode.height('auto');

          const requiredHeight = textNode.height() + 8;

          // 원래 크기로 복원
          textNode.width(originalWidth);
          textNode.height(originalHeight);

          // 텍스트를 모두 표시하기 위한 최소 높이
          newHeight = Math.max(newHeight, requiredHeight);

          // 텍스트 노드 스케일 리셋
          textNode.scaleX(1);
          textNode.scaleY(1);
        }
      }

      const newX = node.x();
      const newY = node.y();

      onChange({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });
    },
    [shapeItem.width, shapeItem.height, shapeItem.text, onChange],
  );

  // 공통 Drag 핸들러
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    onDragStart?.();
  }, [onDragStart]);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const newX = e.target.x();
      const newY = e.target.y();

      onDragMove?.(newX, newY);
    },
    [onDragMove],
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false);

      const newX = e.target.x();
      const newY = e.target.y();

      onChange({ x: newX, y: newY });
      onDragEnd?.();
    },
    [onChange, onDragEnd],
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
        x={offsetX}
        y={0}
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
    // 도형 타입별 onDragMove 처리를 위해 여기서는 할당하지 않음
    onTransformStart: () => setIsTransforming(true),
    onTransform: handleTransform,
  };

  if (shapeItem.shapeType === 'rect') {
    return (
      <Group
        {...groupProps}
        onDragEnd={(e) => handleDragEnd(e)}
        onDragMove={(e) => handleDragMove(e)}
        onTransformEnd={(e) => handleTransformEnd(e)}
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
        onDragEnd={(e) => handleDragEnd(e)}
        onDragMove={(e) => handleDragMove(e)}
        onTransformEnd={(e) => handleTransformEnd(e)}
      >
        <Ellipse
          x={width / 2}
          y={height / 2}
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
      onDragEnd={(e) => handleDragEnd(e)}
      onDragMove={(e) => handleDragMove(e)}
      onTransformEnd={(e) => handleTransformEnd(e)}
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
