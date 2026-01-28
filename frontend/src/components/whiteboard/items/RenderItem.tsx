'use client';

import React from 'react';
import { useCursorStyle } from '@/hooks/useCursorStyle';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import TextItem from '@/components/whiteboard/items/text/TextItem';
import ShapeItem from '@/components/whiteboard/items/shape/ShapeItem';
import CustomArrow from '@/components/whiteboard/items/arrow/CustomArrow';
import LineItem from '@/components/whiteboard/items/line/LineItem';
import DrawingItem from '@/components/whiteboard/items/drawing/DrawingItem';
import ImageItem from '@/components/whiteboard/items/image/ImageItem';
import VideoItem from '@/components/whiteboard/items/video/VideoItem';
import YoutubeItem from '@/components/whiteboard/items/youtube/YoutubeItem';
import StackItem from '@/components/whiteboard/items/stack/StackItem';

import type {
  TextItem as TextItemType,
  ArrowItem,
  LineItem as LineItemType,
  DrawingItem as DrawingItemType,
  ShapeItem as ShapeItemType,
  ImageItem as ImageItemType,
  VideoItem as VideoItemType,
  YoutubeItem as YoutubeItemType,
  StackItem as StackItemType,
  WhiteboardItem,
} from '@/types/whiteboard';

// RenderItem Props
interface RenderItemProps {
  item: WhiteboardItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, newAttributes: Partial<WhiteboardItem>) => void;
  onDragStart?: () => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onTransformMove?: (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    rotation: number,
  ) => void;
  onDragEnd?: () => void;
  onArrowDblClick?: (id: string) => void;
  onShapeDblClick?: (id: string) => void;
}

function RenderItem({
  item,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onTransformMove,
  onDragEnd,
  onArrowDblClick,
  onShapeDblClick,
}: RenderItemProps) {
  // 아이템 인터랙션 상태
  const { isDraggable, isListening } = useItemInteraction();

  // 커서 스타일 훅
  const { handleMouseEnter, handleMouseLeave } = useCursorStyle('move');

  if (item.type === 'text') {
    const textItem = item as TextItemType;
    return (
      <TextItem
        textItem={textItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (item.type === 'arrow') {
    const arrowItem = item as ArrowItem;
    return (
      <CustomArrow
        item={arrowItem}
        isSelected={isSelected}
        onSelect={onSelect}
        onChange={(attrs) => onChange(item.id, attrs)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onArrowDblClick={onArrowDblClick}
      />
    );
  }

  if (item.type === 'line') {
    const lineItem = item as LineItemType;
    return (
      <LineItem
        lineItem={lineItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onArrowDblClick={onArrowDblClick}
      />
    );
  }

  if (item.type === 'drawing') {
    const drawingItem = item as DrawingItemType;
    return (
      <DrawingItem
        drawingItem={drawingItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (item.type === 'shape') {
    const shapeItem = item as ShapeItemType;
    return (
      <ShapeItem
        shapeItem={shapeItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onDblClick={() => onShapeDblClick?.(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragMove={(x, y) => onDragMove?.(item.id, x, y)}
        onTransformMove={(x, y, w, h, rotation) =>
          onTransformMove?.(item.id, x, y, w, h, rotation)
        }
        onDragEnd={onDragEnd}
      />
    );
  }

  if (item.type === 'image') {
    const imageItem = item as ImageItemType;
    return (
      <ImageItem
        imageItem={imageItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (item.type === 'video') {
    const videoItem = item as VideoItemType;
    return (
      <VideoItem
        videoItem={videoItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (item.type === 'youtube') {
    const youtubeItem = item as YoutubeItemType;
    return (
      <YoutubeItem
        youtubeItem={youtubeItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (item.type === 'stack') {
    const stackItem = item as StackItemType;
    return (
      <StackItem
        stackItem={stackItem}
        isDraggable={isDraggable}
        isListening={isListening}
        isSelected={isSelected}
        onSelect={() => onSelect(item.id)}
        onChange={(attrs) => onChange(item.id, attrs)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  return null;
}

export default React.memo(RenderItem, (prevProps, nextProps) => {
  // item, isSelected, onSelect, onChange 등이 변경되지 않으면 재렌더링 넘김
  return (
    prevProps.item === nextProps.item &&
    prevProps.isSelected === nextProps.isSelected
  );
});
