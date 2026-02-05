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
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (changes: Partial<TextItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
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
  onDragMove,
  onDragEnd,
}: TextItemProps) {
  const setEditingTextId = useWhiteboardLocalStore(
    (state) => state.setEditingTextId,
  );
  const selectedIds = useWhiteboardLocalStore((state) => state.selectedIds);
  const { isInteractive } = useItemInteraction();
  const isMultiSelected =
    selectedIds.length > 1 && selectedIds.includes(textItem.id);

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
      name="whiteboard-item"
      draggable={isDraggable}
      listening={isListening}
      onMouseDown={(e) => isInteractive && onSelect(e)}
      onTouchStart={(e) => isInteractive && onSelect(e)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDblClick={(e) => {
        if (!isInteractive) return;
        setEditingTextId(textItem.id);
        onSelect(e);
      }}
      onDblTap={(e) => {
        if (!isInteractive) return;
        setEditingTextId(textItem.id);
        onSelect(e);
      }}
      onDragStart={() => {
        if (!isInteractive) return;
        setIsDragging(true);
        onDragStart?.();
      }}
      onDragMove={(e) => {
        if (!isInteractive) return;
        onDragMove?.(e.target.x(), e.target.y());
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
        const node = e.target as Konva.Text;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Transform 중 스케일 보정
        if (scaleX !== 1 || scaleY !== 1) {
          node.scaleX(1);
          node.scaleY(1);
          node.width(node.width() * scaleX);

          if (isMultiSelected) {
            node.fontSize(node.fontSize() * scaleY);
          }
        }
      }}
      onTransformEnd={(e) => {
        if (!isInteractive) return;
        if (isMultiSelected) return;
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
