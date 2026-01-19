'use client';

import Konva from 'konva';
import { Text, Arrow, Line } from 'react-konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCursorStyle } from '@/hooks/useCursorStyle';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import ShapeItem from '@/components/whiteboard/items/shape/ShapeItem';
import ImageItem from '@/components/whiteboard/items/image/ImageItem';
import VideoItem from '@/components/whiteboard/items/video/VideoItem';
import YoutubeItem from '@/components/whiteboard/items/youtube/YoutubeItem';

import type {
  TextItem,
  ArrowItem,
  DrawingItem,
  ShapeItem as ShapeItemType,
  ImageItem as ImageItemType,
  VideoItem as VideoItemType,
  YoutubeItem as YoutubeItemType,
  WhiteboardItem,
} from '@/types/whiteboard';

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

  // 아이템 인터랙션 상태
  const { isInteractive, isDraggable, isListening } = useItemInteraction();

  // 커서 스타일 훅
  const { handleMouseEnter, handleMouseLeave } = useCursorStyle('move');

  // 텍스트 렌더링
  if (item.type === 'text') {
    const textItem = item as TextItem;
    return (
      <Text
        {...textItem}
        id={item.id}
        draggable={isDraggable}
        listening={isListening}
        onMouseDown={() => isInteractive && onSelect(item.id)}
        onTouchStart={() => isInteractive && onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDblClick={() => {
          if (!isInteractive) return;
          setEditingTextId(item.id);
          onSelect(item.id);
        }}
        onDragEnd={(e) => {
          if (!isInteractive) return;
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
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

  // Arrow Rendering
  if (item.type === 'arrow') {
    const arrowItem = item as ArrowItem;
    return (
      <Arrow
        {...arrowItem}
        id={item.id}
        draggable={isDraggable}
        listening={isListening}
        hitStrokeWidth={30}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        onMouseDown={() => isInteractive && onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDblClick={() => {
          if (!isInteractive) return;
          onArrowDblClick?.(item.id);
        }}
        onDragStart={() => {
          if (!isInteractive) return;
          onDragStart?.();
        }}
        onDragEnd={(e) => {
          if (!isInteractive) return;
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

  // 그리기 렌더링
  if (item.type === 'drawing') {
    const drawingItem = item as DrawingItem;
    return (
      <Line
        {...drawingItem}
        id={item.id}
        draggable={isDraggable}
        listening={isListening}
        hitStrokeWidth={30}
        tension={0.4}
        lineCap="round"
        lineJoin="round"
        strokeScaleEnabled={true}
        onMouseDown={() => isInteractive && onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragEnd={(e) => {
          if (!isInteractive) return;
          const pos = e.target.position();
          const newPoints = drawingItem.points.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );

          e.target.position({ x: 0, y: 0 });

          onChange({
            points: newPoints,
          });
        }}
        onTransform={(e) => {
          if (!isInteractive) return;
          const node = e.target;

          if (node.getClassName() !== 'Line') return;
          const lineNode = node as Konva.Line;

          const scaleX = lineNode.scaleX();
          const scaleY = lineNode.scaleY();

          // 현재 points를 가져와서 scale 적용
          const currentPoints = lineNode.points();
          const newPoints = currentPoints.map((p, i) =>
            i % 2 === 0 ? p * scaleX : p * scaleY,
          );

          lineNode.points(newPoints);
          lineNode.scaleX(1);
          lineNode.scaleY(1);
        }}
        onTransformEnd={(e) => {
          if (!isInteractive) return;
          const node = e.target;

          if (node.getClassName() !== 'Line') return;
          const lineNode = node as Konva.Line;

          onChange({
            points: lineNode.points(),
            rotation: lineNode.rotation(),
            scaleX: 1,
            scaleY: 1,
          });
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
        isDraggable={isDraggable}
        isListening={isListening}
        onSelect={() => isInteractive && onSelect(item.id)}
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
