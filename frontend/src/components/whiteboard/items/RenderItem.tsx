'use client';

import Konva from 'konva';
import { Text, Arrow, Line } from 'react-konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCursorStyle } from '@/hooks/useCursorStyle';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import ShapeItem from '@/components/whiteboard/items/shape/ShapeItem';
import CustomArrow from '@/components/whiteboard/items/arrow/CustomArrow';

import type {
  TextItem,
  ArrowItem,
  LineItem,
  WhiteboardItem,
  ShapeItem as ShapeItemType,
  DrawingItem,
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
  const { isInteractive, isEraserMode, isDraggable, isListening } =
    useItemInteraction();

  // 커서 스타일 훅
  const { handleMouseEnter, handleMouseLeave } = useCursorStyle('move');

  if (item.type === 'text') {
    const textItem = item as TextItem;
    return (
      <Text
        {...textItem}
        id={item.id}
        draggable={isDraggable}
        listening={isListening}
        onMouseDown={() => isInteractive && !isEraserMode && onSelect(item.id)}
        onTouchStart={() => isInteractive && !isEraserMode && onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDblClick={() => {
          if (!isInteractive || isEraserMode) return;
          setEditingTextId(item.id);
          onSelect(item.id);
        }}
        onDragEnd={(e) => {
          if (!isInteractive || isEraserMode) return;
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransform={(e) => {
          if (!isInteractive || isEraserMode) return;
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
          if (!isInteractive || isEraserMode) return;
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

  if (item.type === 'arrow') {
    const arrowItem = item as ArrowItem;

    // 커스텀 머리 타입이 설정되어 있으면 CustomArrow 사용
    const hasCustomHead =
      arrowItem.startHeadType !== undefined ||
      arrowItem.endHeadType !== undefined;

    if (hasCustomHead) {
      return (
        <CustomArrow
          item={arrowItem}
          onSelect={onSelect}
          onChange={onChange}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onArrowDblClick={onArrowDblClick}
        />
      );
    }

    // 기본 Konva Arrow
    return (
      <Arrow
        {...arrowItem}
        id={item.id}
        draggable={isDraggable}
        listening={isListening}
        hitStrokeWidth={30}
        lineCap="round"
        lineJoin="round"
        onMouseDown={() => isInteractive && !isEraserMode && onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDblClick={() => {
          if (!isInteractive || isEraserMode) return;
          onArrowDblClick?.(item.id);
        }}
        onDragStart={() => {
          if (!isInteractive || isEraserMode) return;
          onDragStart?.();
        }}
        onDragEnd={(e) => {
          if (!isInteractive || isEraserMode) return;
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

  if (item.type === 'line') {
    const lineItem = item as LineItem;
    return (
      <Line
        {...lineItem}
        id={item.id}
        draggable={isDraggable}
        listening={isListening}
        hitStrokeWidth={30}
        lineCap="round"
        lineJoin="round"
        onMouseDown={() => isInteractive && !isEraserMode && onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDblClick={() => {
          if (!isInteractive || isEraserMode) return;
          onArrowDblClick?.(item.id);
        }}
        onDragStart={() => {
          if (!isInteractive || isEraserMode) return;
          onDragStart?.();
        }}
        onDragEnd={(e) => {
          if (!isInteractive || isEraserMode) return;
          const pos = e.target.position();
          const newPoints = lineItem.points.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );
          e.target.position({ x: 0, y: 0 });
          onChange({ points: newPoints });
          onDragEnd?.();
        }}
      />
    );
  }

  if (item.type === 'drawing') {
    const drawingItem = item as DrawingItem;
    return (
      <Line
        {...drawingItem}
        id={item.id}
        draggable={isDraggable}
        listening={isListening}
        hitStrokeWidth={30}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        strokeScaleEnabled={true}
        onMouseDown={() => isInteractive && !isEraserMode && onSelect(item.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragEnd={(e) => {
          if (!isInteractive || isEraserMode) return;
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
          if (!isInteractive || isEraserMode) return;
          const node = e.target;

          if (node.getClassName() !== 'Line') return;
          const lineNode = node as Konva.Line;

          const scaleX = lineNode.scaleX();
          const scaleY = lineNode.scaleY();

          // strokeWidth를 scale로 나눠서 두께 유지
          const avgScale = (scaleX + scaleY) / 2;
          lineNode.strokeWidth(drawingItem.strokeWidth / avgScale);
        }}
        onTransformEnd={(e) => {
          if (!isInteractive || isEraserMode) return;
          const node = e.target;

          if (node.getClassName() !== 'Line') return;
          const lineNode = node as Konva.Line;

          const scaleX = lineNode.scaleX();
          const scaleY = lineNode.scaleY();

          // 기존 좌표에 scale 곱한 후 scale 1로 초기화
          const newPoints = drawingItem.points.map((p, i) =>
            i % 2 === 0 ? p * scaleX : p * scaleY,
          );

          lineNode.scaleX(1);
          lineNode.scaleY(1);

          //두께 유지
          lineNode.strokeWidth(drawingItem.strokeWidth);

          onChange({
            points: newPoints,
            rotation: lineNode.rotation(),
            scaleX: 1,
            scaleY: 1,
          });
        }}
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
        onSelect={() => isInteractive && !isEraserMode && onSelect(item.id)}
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
