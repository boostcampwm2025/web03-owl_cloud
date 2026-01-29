'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';

import Konva from 'konva';
import { Stage, Layer, Rect, Line } from 'react-konva';

import type {
  WhiteboardItem,
  TextItem,
  ArrowItem,
  ShapeItem,
} from '@/types/whiteboard';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
import { useItemActions } from '@/hooks/useItemActions';
import { cn } from '@/utils/cn';
import {
  updateBoundArrows,
  getDraggingArrowPoints,
} from '@/utils/arrowBinding';
import { getViewportRect, filterVisibleItems } from '@/utils/viewport';

import { useElementSize } from '@/hooks/useElementSize';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts';
import { useArrowHandles } from '@/hooks/useArrowHandles';
import { useCanvasMouseEvents } from '@/hooks/useCanvasMouseEvents';

import RenderItem from '@/components/whiteboard/items/RenderItem';
import TextArea from '@/components/whiteboard/items/text/TextArea';
import ShapeTextArea from '@/components/whiteboard/items/shape/ShapeTextArea';
import ItemTransformer from '@/components/whiteboard/controls/ItemTransformer';
import RemoteSelectionLayer from '@/components/whiteboard/remote/RemoteSelectionLayer';
import ArrowHandles from '@/components/whiteboard/items/arrow/ArrowHandles';
import Portal from '@/components/common/Portal';

const GEOMETRY_KEYS = ['x', 'y', 'width', 'height', 'rotation'] as const;

export default function Canvas() {
  const canvasWidth = useWhiteboardSharedStore((state) => state.canvasWidth);
  const canvasHeight = useWhiteboardSharedStore((state) => state.canvasHeight);
  const items = useWhiteboardSharedStore((state) => state.items);
  const selectedId = useWhiteboardLocalStore((state) => state.selectedId);
  const editingTextId = useWhiteboardLocalStore((state) => state.editingTextId);
  const selectItem = useWhiteboardLocalStore((state) => state.selectItem);
  const { updateItem, performTransaction } = useItemActions();
  const setEditingTextId = useWhiteboardLocalStore(
    (state) => state.setEditingTextId,
  );
  const setViewportSize = useWhiteboardLocalStore(
    (state) => state.setViewportSize,
  );
  const setStageScale = useWhiteboardLocalStore((state) => state.setStageScale);
  const setStagePos = useWhiteboardLocalStore((state) => state.setStagePos);
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const myUserId = useWhiteboardAwarenessStore((state) => state.myUserId);

  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const [isDraggingArrow, setIsDraggingArrow] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [localDraggingId, setLocalDraggingId] = useState<string | null>(null);
  const [localDraggingPos, setLocalDraggingPos] = useState<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
  } | null>(null);

  // Viewport culling을 위한 상태
  const [viewportRect, setViewportRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const size = useElementSize(containerRef);

  // 초기 Stage 위치 설정
  useEffect(() => {
    const stage = stageRef.current;
    if (
      !stage ||
      !isInitialMount.current ||
      size.width === 0 ||
      size.height === 0
    )
      return;

    // 캔버스를 화면 정가운데 배치
    const centerPos = {
      x: (size.width - canvasWidth) / 2,
      y: (size.height - canvasHeight) / 2,
    };

    stage.scale({ x: 1, y: 1 });
    stage.position(centerPos);
    stage.batchDraw();
    setViewportSize(size.width, size.height);
    setStagePos(centerPos);
    setStageScale(1);

    useWhiteboardLocalStore.getState().setStageRef(stageRef);

    isInitialMount.current = false;
  }, [
    size.width,
    size.height,
    canvasWidth,
    canvasHeight,
    setViewportSize,
    setStagePos,
    setStageScale,
  ]);

  // viewport 업데이트
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateViewport = () => {
      setViewportRect(getViewportRect(stage));
    };

    // 초기 viewport 설정
    updateViewport();

    // Stage 이동/줌 시 viewport 업데이트
    let rafId: number;
    const throttledUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateViewport();
        rafId = 0;
      });
    };

    stage.on('dragmove', throttledUpdate);
    stage.on('wheel', throttledUpdate);

    return () => {
      stage.off('dragmove', throttledUpdate);
      stage.off('wheel', throttledUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // 화면에 보이는 아이템만 필터링
  const visibleItems = useMemo(() => {
    if (!viewportRect) return items;
    const filtered = filterVisibleItems(items, viewportRect);

    return filtered;
  }, [items, viewportRect]);

  // 줌 레벨에 따른 pixelRatio 조절
  const [pixelRatio, setPixelRatio] = useState(window.devicePixelRatio);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updatePixelRatio = () => {
      const scale = stage.scaleX();
      let ratio: number;
      if (scale >= 1.5) ratio = window.devicePixelRatio;
      else if (scale >= 1) ratio = 1.5;
      else if (scale >= 0.5) ratio = 1;
      else if (scale >= 0.3) ratio = 0.5;
      else ratio = 0.25;

      setPixelRatio(ratio);
    };

    updatePixelRatio();

    stage.on('wheel', updatePixelRatio);

    return () => {
      stage.off('wheel', updatePixelRatio);
    };
  }, []);

  // viewport 크기를 store에 업데이트
  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      setViewportSize(size.width, size.height);
    }
  }, [size.width, size.height, setViewportSize]);

  const { handleWheel, handleDragMove, handleDragEnd } = useCanvasInteraction(
    size.width,
    size.height,
  );

  const handleWheelWithEvent = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      handleWheel(e);

      const stage = stageRef.current;
      if (!stage) return;

      // wheel 후 커서 위치 업데이트
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        const transform = stage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point(pointerPos);

        const awareness = useWhiteboardSharedStore.getState().awareness;
        if (awareness) {
          const currentState = awareness.getLocalState();
          if (currentState) {
            awareness.setLocalState({
              ...currentState,
              cursor: { x: canvasPos.x, y: canvasPos.y },
            });
          }
        }
      }

      stage.fire('stageTransformChange');
    },
    [handleWheel],
  );

  const editingItem = useMemo(
    () =>
      items.find((item) => item.id === editingTextId) as
        | TextItem
        | ShapeItem
        | undefined,
    [items, editingTextId],
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );

  const isArrowOrLineSelected =
    selectedItem?.type === 'arrow' || selectedItem?.type === 'line';

  // 화살표/선 훅
  const {
    selectedHandleIndex,
    setSelectedHandleIndex,
    handleHandleClick,
    handleArrowStartDrag,
    handleArrowControlPointDrag,
    handleArrowEndDrag,
    handleHandleDragEnd,
    handleArrowDblClick,
    deleteControlPoint,
    draggingPoints,
    snapIndicator,
  } = useArrowHandles({
    arrow: isArrowOrLineSelected ? (selectedItem as ArrowItem) : null,
    items,
    stageRef,
    updateItem,
  });

  // 도형 더블클릭 핸들러 (텍스트 편집 모드)
  const handleShapeDblClick = (id: string) => {
    setEditingTextId(id);
  };

  // 선택 해제 핸들러
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

  // 외부 클릭 시 선택 해제
  useClickOutside(
    containerRef,
    (e) => {
      const target = e.target as HTMLElement;
      // 사이드바 클릭은 무시
      if (target.closest('aside')) {
        return;
      }

      if (selectedId) {
        selectItem(null);
        setSelectedHandleIndex(null);
      }
    },
    !editingTextId && !!selectedId,
  );

  // 마우스 이벤트 통합 훅
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    currentDrawing,
  } = useCanvasMouseEvents({
    onDeselect: handleCheckDeselect,
  });

  // 캔버스 드래그 가능 여부
  const isDraggable = useWhiteboardLocalStore(
    (state) => state.cursorMode === 'move',
  );

  useCanvasShortcuts({
    isArrowOrLineSelected,
    selectedHandleIndex,
    deleteControlPoint,
  });

  const handleItemChange = useCallback(
    (id: string, newAttributes: Partial<WhiteboardItem>) => {
      performTransaction(() => {
        updateItem(id, newAttributes);

        // 도형에 연결된 화살표 업데이트
        const isGeometryChanged = GEOMETRY_KEYS.some(
          (key) => key in newAttributes,
        );
        if (!isGeometryChanged) return;

        const changedItem = items.find((item) => item.id === id);
        if (!changedItem || changedItem.type !== 'shape') return;

        const updatedShape = { ...changedItem, ...newAttributes } as ShapeItem;
        updateBoundArrows(id, updatedShape, items, updateItem);
      });
    },
    [items, updateItem, performTransaction],
  );

  const handleDragMoveItem = useCallback((id: string, x: number, y: number) => {
    setLocalDraggingId(id);
    setLocalDraggingPos((prev) => (prev ? { ...prev, x, y } : { x, y }));
  }, []);

  const handleTransformMoveItem = useCallback(
    (
      id: string,
      x: number,
      y: number,
      w: number,
      h: number,
      rotation: number,
    ) => {
      setLocalDraggingId(id);
      setLocalDraggingPos({ x, y, width: w, height: h, rotation });
    },
    [],
  );

  const handleDragEndItem = useCallback(() => {
    setIsDraggingArrow(false);
    setLocalDraggingId(null);
    setLocalDraggingPos(null);
  }, []);

  // width={0} height={0}으로 canvas 렌더링 방지
  if (size.width === 0 || size.height === 0) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center"
      ></div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full w-full flex-none overflow-hidden bg-neutral-100',
        cursorMode === 'select' && 'cursor-default',
        cursorMode === 'move' && !isDraggingCanvas && 'cursor-grab',
        cursorMode === 'move' && isDraggingCanvas && 'cursor-grabbing',
        cursorMode === 'draw' && 'cursor-crosshair',
        cursorMode === 'eraser' && 'cursor-cell',
      )}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        draggable={isDraggable}
        pixelRatio={pixelRatio}
        onWheel={handleWheelWithEvent}
        onDragStart={() => setIsDraggingCanvas(true)}
        onDragMove={handleDragMove}
        onDragEnd={(e) => {
          handleDragEnd(e);
          setIsDraggingCanvas(false);
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleCheckDeselect}
      >
        <Layer
          clipX={0}
          clipY={0}
          clipWidth={canvasWidth}
          clipHeight={canvasHeight}
        >
          {/* Canvas 경계 */}
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

          {/* 아이템 렌더링 */}
          {(() => {
            const draggingTargetShape =
              localDraggingId && localDraggingPos
                ? (items.find((it) => it.id === localDraggingId) as ShapeItem)
                : null;

            return visibleItems.map((item) => {
              // 드래그 중인 아이템의 실시간 위치
              let displayItem = item;
              if (localDraggingId === item.id && localDraggingPos) {
                displayItem = {
                  ...item,
                  x: localDraggingPos.x,
                  y: localDraggingPos.y,
                } as WhiteboardItem;
              }

              // 화살표인 경우, 부착 대상이 드래그 중인지 확인하고 계산
              if (
                item.type === 'arrow' &&
                localDraggingId &&
                localDraggingPos &&
                draggingTargetShape
              ) {
                const tempPoints = getDraggingArrowPoints(
                  item as ArrowItem,
                  localDraggingId,
                  localDraggingPos.x,
                  localDraggingPos.y,
                  draggingTargetShape,
                  localDraggingPos.width,
                  localDraggingPos.height,
                  localDraggingPos.rotation,
                );
                if (tempPoints && Array.isArray(tempPoints)) {
                  displayItem = {
                    ...displayItem,
                    points: tempPoints,
                  } as WhiteboardItem;
                }
              }

              // 핸들 드래그 중인 화살표
              if (
                displayItem.id === selectedId &&
                (displayItem.type === 'arrow' || displayItem.type === 'line') &&
                draggingPoints &&
                Array.isArray(draggingPoints)
              ) {
                displayItem = {
                  ...displayItem,
                  points: draggingPoints,
                } as WhiteboardItem;
              }

              return (
                <RenderItem
                  key={item.id}
                  item={displayItem}
                  isSelected={item.id === selectedId}
                  onSelect={selectItem}
                  onChange={(newAttributes) =>
                    handleItemChange(item.id, newAttributes)
                  }
                  onArrowDblClick={handleArrowDblClick}
                  onShapeDblClick={handleShapeDblClick}
                  onDragStart={() => {
                    if (item.type === 'arrow' || item.type === 'line') {
                      setIsDraggingArrow(true);
                    }
                    setLocalDraggingId(item.id);
                    const geoItem = item as {
                      x: number;
                      y: number;
                      width?: number;
                      height?: number;
                      rotation?: number;
                    };
                    setLocalDraggingPos({
                      x: geoItem.x,
                      y: geoItem.y,
                      width: geoItem.width,
                      height: geoItem.height,
                      rotation: geoItem.rotation,
                    });
                  }}
                  onDragMove={handleDragMoveItem}
                  onTransformMove={handleTransformMoveItem}
                  onDragEnd={handleDragEndItem}
                />
              );
            });
          })()}
          {isArrowOrLineSelected && selectedItem && !isDraggingArrow && (
            <ArrowHandles
              arrow={selectedItem as ArrowItem}
              selectedHandleIndex={selectedHandleIndex}
              onHandleClick={handleHandleClick}
              onStartDrag={handleArrowStartDrag}
              onControlPointDrag={handleArrowControlPointDrag}
              onEndDrag={handleArrowEndDrag}
              onDragEnd={handleHandleDragEnd}
              draggingPoints={draggingPoints}
            />
          )}

          {/* 부착 표시 */}
          {snapIndicator && (
            <Rect
              x={snapIndicator.x}
              y={snapIndicator.y}
              width={snapIndicator.width}
              height={snapIndicator.height}
              rotation={snapIndicator.rotation}
              stroke="#0096FF"
              strokeWidth={3}
              cornerRadius={3}
            />
          )}

          {/* 그리는 중인 선 */}
          {currentDrawing && (
            <Line
              points={currentDrawing.points}
              stroke={currentDrawing.stroke}
              strokeWidth={currentDrawing.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* 다른 사용자의 선택 표시 */}
          <RemoteSelectionLayer
            myUserId={myUserId}
            selectedId={selectedId}
            items={items}
            stageRef={stageRef}
          />

          {/* 내 Transformer */}
          <ItemTransformer
            selectedId={selectedId}
            items={items}
            stageRef={stageRef}
          />
        </Layer>
      </Stage>

      {/* 텍스트 편집 모드 */}
      {editingTextId && editingItem && editingItem.type === 'text' && (
        <Portal>
          <TextArea
            textId={editingTextId}
            textItem={editingItem as TextItem}
            stageRef={stageRef}
            onChange={(newText) => {
              updateItem(editingTextId, { text: newText });
            }}
            onClose={() => {
              setEditingTextId(null);
              selectItem(null);
            }}
          />
        </Portal>
      )}

      {/* 도형 텍스트 편집 모드 */}
      {editingTextId && editingItem && editingItem.type === 'shape' && (
        <Portal>
          <ShapeTextArea
            shapeId={editingTextId}
            shapeItem={editingItem as ShapeItem}
            stageRef={stageRef}
            onChange={(newText) => {
              updateItem(editingTextId, { text: newText });
            }}
            onClose={() => {
              setEditingTextId(null);
              selectItem(null);
            }}
            onSizeChange={(width, height, newY, newX, newText) => {
              const updates: Partial<ShapeItem> = { width, height };
              if (newY !== undefined) updates.y = newY;
              if (newX !== undefined) updates.x = newX;
              if (newText !== undefined) updates.text = newText;

              updateItem(editingTextId, updates);
            }}
          />
        </Portal>
      )}
    </div>
  );
}
