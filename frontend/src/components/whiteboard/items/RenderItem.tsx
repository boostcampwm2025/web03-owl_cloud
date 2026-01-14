'use client';

import Konva from 'konva';

import { Text, Arrow } from 'react-konva';
import type {
  TextItem,
  ArrowItem,
  ShapeItem as ShapeItemType,
  ImageItem as ImageItemType,
  VideoItem as VideoItemType,
  YoutubeItem as YoutubeItemType,
  WhiteboardItem,
} from '@/types/whiteboard';
import ShapeItem from '@/components/whiteboard/items/shape/ShapeItem';
import ImageItem from '@/components/whiteboard/items/image/ImageItem';
import VideoItem from '@/components/whiteboard/items/video/VideoItem';
import YoutubeItem from '@/components/whiteboard/items/youtube/YoutubeItem';

import { useCanvasStore } from '@/store/useCanvasStore';

// RenderItem Props
interface RenderItemProps {
  item: WhiteboardItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (newAttributes: Partial<WhiteboardItem>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onArrowDblClick?: (id: string) => void;
}

// RenderItem Component
export default function RenderItem({
  item,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onArrowDblClick,
}: RenderItemProps) {
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);

  // Mouse Enter 시 커서 모양 변경
  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'move';
  };

  // Mouse Leave 시 커서 모양 기본값으로 변경
  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'default';
  };

  // Text Rendering
  if (item.type === 'text') {
    const textItem = item as TextItem;
    return (
      <Text
        {...textItem}
        id={item.id}
        draggable
        onMouseDown={() => onSelect(item.id)}
        onTouchStart={() => onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDblClick={() => {
          setEditingTextId(item.id);
          onSelect(item.id);
        }}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={(e) => {
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

  // Arrow Rendering
  if (item.type === 'arrow') {
    const arrowItem = item as ArrowItem;
    return (
      <Arrow
        {...arrowItem}
        id={item.id}
        draggable
        hitStrokeWidth={30}
        onMouseDown={() => onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDblClick={() => onArrowDblClick?.(item.id)}
        onDragStart={onDragStart}
        onDragEnd={(e) => {
          const pos = e.target.position();
          const newPoints = arrowItem.points.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );
          e.target.position({ x: 0, y: 0 });
          onChange({ points: newPoints });
          onDragEnd?.();
        }}
      />
    );
  }

  // Shape Rendering
  if (item.type === 'shape') {
    const shapeItem = item as ShapeItemType;
    return (
      <ShapeItem
        shapeItem={shapeItem}
        onSelect={() => onSelect(item.id)}
        onChange={onChange}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  // Image Rendering
  if (item.type === 'image') {
    const imageItem = item as ImageItemType;
    return (
      <ImageItem
        imageItem={imageItem}
        onSelect={() => onSelect(item.id)}
        onChange={onChange}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  // Video Rendering
  if (item.type === 'video') {
    const videoItem = item as VideoItemType;
    return (
      <VideoItem
        videoItem={videoItem}
        onSelect={() => onSelect(item.id)}
        onChange={onChange}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  // Youtube Rendering
  if (item.type === 'youtube') {
    const youtubeItem = item as YoutubeItemType;
    return (
      <YoutubeItem
        youtubeItem={youtubeItem}
        onSelect={() => onSelect(item.id)}
        onChange={onChange}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  return null;
}
