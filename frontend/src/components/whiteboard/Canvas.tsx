'use client';

import { useRef, useState, useMemo } from 'react';

import Konva from 'konva';
import { Stage, Layer, Rect } from 'react-konva';

import type { WhiteboardItem, TextItem, ArrowItem } from '@/types/whiteboard';

import { useCanvasStore } from '@/store/useCanvasStore';

import { useWindowSize } from '@/hooks/useWindowSize';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts';
import { useArrowHandles } from '@/hooks/useArrowHandles';

import RenderItem from '@/components/whiteboard/items/RenderItem';
import TextArea from '@/components/whiteboard/items/text/TextArea';
import ItemTransformer from '@/components/whiteboard/controls/ItemTransformer';
import ArrowHandles from '@/components/whiteboard/items/arrow/ArrowHandles';

export default function Canvas() {
  const stageScale = useCanvasStore((state) => state.stageScale);
  const stagePos = useCanvasStore((state) => state.stagePos);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);
  const items = useCanvasStore((state) => state.items);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const editingTextId = useCanvasStore((state) => state.editingTextId);
  const selectItem = useCanvasStore((state) => state.selectItem);
  const updateItem = useCanvasStore((state) => state.updateItem);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);

  const stageRef = useRef<Konva.Stage | null>(null);
  const [isDraggingArrow, setIsDraggingArrow] = useState(false);

  const size = useWindowSize();
  const { handleWheel, handleDragMove, handleDragEnd } = useCanvasInteraction(
    size.width,
    size.height,
  );

  const editingItem = useMemo(
    () =>
      items.find((item) => item.id === editingTextId) as TextItem | undefined,
    [items, editingTextId],
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );

  const isArrowSelected = selectedItem?.type === 'arrow';

  const {
    selectedHandleIndex,
    setSelectedHandleIndex,
    handleHandleClick,
    handleArrowStartDrag,
    handleArrowControlPointDrag,
    handleArrowEndDrag,
    handleArrowDblClick,
    deleteControlPoint,
  } = useArrowHandles({
    arrow: isArrowSelected ? (selectedItem as ArrowItem) : null,
    stageRef,
    updateItem,
  });

  useCanvasShortcuts({
    isArrowSelected,
    selectedHandleIndex,
    deleteControlPoint,
  });

  const handleCheckDeselect = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (editingTextId) return;

    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');

    if (clickedOnEmpty) {
      selectItem(null);
      setSelectedHandleIndex(null);
    }
  };

  const handleItemChange = (
    id: string,
    newAttributes: Partial<WhiteboardItem>,
  ) => {
    updateItem(id, newAttributes);
  };

  if (size.width === 0 || size.height === 0) return null;

  return (
    <div className="h-full w-full overflow-hidden bg-neutral-100">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        draggable
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseDown={handleCheckDeselect}
        onTouchStart={handleCheckDeselect}
      >
        <Layer
          clipX={0}
          clipY={0}
          clipWidth={canvasWidth}
          clipHeight={canvasHeight}
        >
          <Rect
            name="bg-rect"
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="white"
            stroke="gray"
            strokeWidth={2}
            listening={true}
          />

          {items.map((item) => (
            <RenderItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onSelect={selectItem}
              onChange={(newAttributes) =>
                handleItemChange(item.id, newAttributes)
              }
              onArrowDblClick={handleArrowDblClick}
              onDragStart={() => {
                if (item.type === 'arrow') {
                  setIsDraggingArrow(true);
                }
              }}
              onDragEnd={() => {
                if (item.type === 'arrow') {
                  setIsDraggingArrow(false);
                }
              }}
            />
          ))}

          {isArrowSelected && selectedItem && !isDraggingArrow && (
            <ArrowHandles
              arrow={selectedItem as ArrowItem}
              selectedHandleIndex={selectedHandleIndex}
              onHandleClick={handleHandleClick}
              onStartDrag={handleArrowStartDrag}
              onControlPointDrag={handleArrowControlPointDrag}
              onEndDrag={handleArrowEndDrag}
            />
          )}

          <ItemTransformer
            selectedId={selectedId}
            items={items}
            stageRef={stageRef}
          />
        </Layer>
      </Stage>

      {editingTextId && editingItem && (
        <TextArea
          textId={editingTextId}
          textItem={editingItem}
          stageRef={stageRef}
          onChange={(newText) => {
            updateItem(editingTextId, { text: newText });
          }}
          onClose={() => {
            setEditingTextId(null);
            selectItem(null);
          }}
        />
      )}
    </div>
  );
}
