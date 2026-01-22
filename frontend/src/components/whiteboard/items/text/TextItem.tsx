'use client';

import { useState } from 'react';
import { Text } from 'react-konva';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import { useItemAnimation } from '@/hooks/useItemAnimation';
import type { TextItem as TextItemType } from '@/types/whiteboard';

interface TextItemProps {
  textItem: TextItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<TextItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function TextItem({
  textItem,
  isDraggable,
  isListening,
  isSelected,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: TextItemProps) {
  const setEditingTextId = useWhiteboardLocalStore(
    (state) => state.setEditingTextId,
  );
  const { isInteractive } = useItemInteraction();

  const [isDragging, setIsDragging] = useState(false);

  const ref = useItemAnimation({
    x: textItem.x,
    y: textItem.y,
    width: textItem.width,
    height: undefined,
    isSelected,
    isDragging,
  });

  return (
    <Text
      {...textItem}
      ref={ref as React.RefObject<Konva.Text>}
      id={textItem.id}
      draggable={isDraggable}
      listening={isListening}
      onMouseDown={() => isInteractive && onSelect()}
      onTouchStart={() => isInteractive && onSelect()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDblClick={() => {
        if (!isInteractive) return;
        setEditingTextId(textItem.id);
        onSelect();
      }}
      onDragStart={() => {
        if (!isInteractive) return;
        setIsDragging(true);
        onDragStart?.();
      }}
      onDragEnd={(e) => {
        if (!isInteractive) return;
        setIsDragging(false);
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
        onDragEnd?.();
      }}
      onTransform={(e) => {
        if (!isInteractive) return;
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Transform 중에도 스케일 보정
        if (scaleX !== 1 || scaleY !== 1) {
          node.scaleX(1);
          node.scaleY(1);
          node.width(node.width() * scaleX);
        }
      }}
      onTransformEnd={(e) => {
        if (!isInteractive) return;
        const node = e.target;
        const scaleX = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
