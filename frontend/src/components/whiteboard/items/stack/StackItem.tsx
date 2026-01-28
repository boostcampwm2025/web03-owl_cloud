'use client';

import { useEffect, useState } from 'react';

import Konva from 'konva';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

import { StackItem as StackItemType } from '@/types/whiteboard';
import { useItemAnimation } from '@/hooks/useItemAnimation';

interface StackItemProps {
  stackItem: StackItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<StackItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function StackItem({
  stackItem,
  isDraggable,
  isListening,
  isSelected,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: StackItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  // 이미지 로드 (CORS 이슈 방지를 위해 anonymous 설정)
  const [image, status] = useImage(stackItem.src, 'anonymous');

  // 애니메이션 훅
  const imageRef = useItemAnimation({
    x: stackItem.x,
    y: stackItem.y,
    width: stackItem.width,
    height: stackItem.height,
    isSelected,
    isDragging,
  });

  // 이미지 로드 완료 후 캔버스 레이어 갱신
  useEffect(() => {
    if (status === 'loaded' && imageRef.current) {
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [status, imageRef]);

  return (
    <KonvaImage
      ref={imageRef as React.RefObject<Konva.Image>}
      id={stackItem.id}
      image={image}
      x={stackItem.x}
      y={stackItem.y}
      width={stackItem.width}
      height={stackItem.height}
      rotation={stackItem.rotation}
      opacity={stackItem.opacity ?? 1}
      draggable={isDraggable}
      listening={isListening}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart?.();
      }}
      onDragEnd={(e) => {
        setIsDragging(false);
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
        onDragEnd?.();
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, stackItem.width * scaleX),
          height: Math.max(5, stackItem.height * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
