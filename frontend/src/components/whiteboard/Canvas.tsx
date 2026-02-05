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
import { cn } from '@/utils/cn';
import {
  updateBoundArrows,
  getDraggingArrowPoints,
} from '@/utils/arrowBinding';
import { getViewportRect, filterVisibleItems } from '@/utils/viewport';

import { useItemActions } from '@/hooks/useItemActions';
import { useElementSize } from '@/hooks/useElementSize';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useArrowHandles } from '@/hooks/useArrowHandles';
import { useCanvasMouseEvents } from '@/hooks/useCanvasMouseEvents';
import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts';
import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';
import { useSelectionBox } from '@/hooks/useSelectionBox';
import { useMultiDrag } from '@/hooks/useMultiDrag';
import { usePinchZoom } from '@/hooks/usePinchZoom';

import RenderItem from '@/components/whiteboard/items/RenderItem';
import TextArea from '@/components/whiteboard/items/text/TextArea';
import ShapeTextArea from '@/components/whiteboard/items/shape/ShapeTextArea';
import ItemTransformer from '@/components/whiteboard/controls/ItemTransformer';
import RemoteSelectionLayer from '@/components/whiteboard/remote/RemoteSelectionLayer';
import RemoteSelectionIndicator from '@/components/whiteboard/remote/RemoteSelectionIndicator';
import ArrowHandles from '@/components/whiteboard/items/arrow/ArrowHandles';
import SelectionBox from '@/components/whiteboard/SelectionBox';
import Portal from '@/components/common/Portal';

const GEOMETRY_KEYS = ['x', 'y', 'width', 'height', 'rotation'] as const;

export default function Canvas() {
  const canvasWidth = useWhiteboardSharedStore((state) => state.canvasWidth);
  const canvasHeight = useWhiteboardSharedStore((state) => state.canvasHeight);
  const items = useWhiteboardSharedStore((state) => state.items);
  const selectedIds = useWhiteboardLocalStore((state) => state.selectedIds);
  const editingTextId = useWhiteboardLocalStore((state) => state.editingTextId);
  const selectOnly = useWhiteboardLocalStore((state) => state.selectOnly);
  const toggleSelection = useWhiteboardLocalStore(
    (state) => state.toggleSelection,
  );
  const addToSelection = useWhiteboardLocalStore(
    (state) => state.addToSelection,
  );
  const clearSelection = useWhiteboardLocalStore(
    (state) => state.clearSelection,
  );
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

  const { processImageFile, getCanvasPointFromEvent } = useAddWhiteboardItem();

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

  // 멀티 드래그 훅
  const {
    startMultiDrag,
    updateMultiDrag,
    finishMultiDrag,
    isMultiDragging,
    getMultiDragPosition,
  } = useMultiDrag({ selectedIds, items });

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

  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedItem = useMemo(
    () =>
      singleSelectedId
        ? items.find((item) => item.id === singleSelectedId)
        : null,
    [items, singleSelectedId],
  );

  const isArrowOrLineSelected =
    !!singleSelectedId &&
    (selectedItem?.type === 'arrow' || selectedItem?.type === 'line');

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
    draggingPoints,
    snapIndicator,
    deleteControlPoint,
  } = useArrowHandles({
    arrow: isArrowOrLineSelected ? (selectedItem as ArrowItem) : null,
    items,
    stageRef,
    updateItem,
  });

  // 키보드 단축키 훅
  useCanvasShortcuts({
    isArrowOrLineSelected,
    selectedHandleIndex,
    deleteControlPoint,
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
      clearSelection();
      setSelectedHandleIndex(null);
    }
  };

  // 드래그 앤 드롭
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 드롭된 데이터에서 파일 리스트를 가져옴
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        // 이미지 파일인 경우 processImageFile 실행
        if (file.type.startsWith('image/')) {
          const point = getCanvasPointFromEvent(e.clientX, e.clientY);
          processImageFile(file, point || undefined);
        }
      }
    },
    [processImageFile, getCanvasPointFromEvent],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 외부 클릭 시 선택 해제
  useClickOutside(
    containerRef,
    (e) => {
      const target = e.target as HTMLElement;
      // 사이드바 클릭은 무시
      if (target.closest('aside') || target.closest('.sidebar-toggle')) {
        return;
      }

      if (selectedIds.length > 0) {
        clearSelection();
        setSelectedHandleIndex(null);
      }
    },
    !editingTextId && selectedIds.length > 0,
  );

  const { startSelection, cancelSelection } = useSelectionBox({
    stageRef,
    enabled: cursorMode === 'select',
  });

  const handleSelectItem = useCallback(
    (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const nativeEvent = e?.evt as MouseEvent | TouchEvent | undefined;
      const shiftKey =
        !!nativeEvent && 'shiftKey' in nativeEvent && nativeEvent.shiftKey;
      const ctrlKey =
        !!nativeEvent && 'ctrlKey' in nativeEvent && nativeEvent.ctrlKey;
      const metaKey =
        !!nativeEvent && 'metaKey' in nativeEvent && nativeEvent.metaKey;

      if (ctrlKey || metaKey) {
        toggleSelection(id);
        return;
      }

      if (shiftKey) {
        addToSelection(id);
        return;
      }

      if (selectedIds.includes(id)) {
        return;
      }

      selectOnly(id);
    },
    [addToSelection, selectOnly, toggleSelection, selectedIds],
  );

  // 마우스 이벤트 통합 훅
  const { handlePointerDown, handlePointerMove, cancelDrawing, cancelErasing } =
    useCanvasMouseEvents({
      onDeselect: handleCheckDeselect,
      onSelectionBoxStart: startSelection,
    });

  // 핀치 줌 훅
  const {
    isActive: isPinching,
    handleTouchStart: handlePinchStart,
    handleTouchMove: handlePinchMove,
    handleTouchEnd: handlePinchEnd,
  } = usePinchZoom({
    stageRef,
    onScaleChange: setStageScale,
    onPositionChange: setStagePos,
    onPinchStart: () => {
      // 핀치 시작 시 그리기/지우개/선택박스 취소
      cancelDrawing();
      cancelErasing();
      cancelSelection();
      // 아이템 선택 해제
      clearSelection();
    },
  });

  // 캔버스 드래그 가능 여부 (핀치 줌 중에는 비활성화함)
  const isDraggable =
    useWhiteboardLocalStore((state) => state.cursorMode === 'move') &&
    !isPinching;

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length === 2) {
        handlePinchStart(e.evt);
      } else {
        handlePointerDown(e);
      }
    },
    [handlePinchStart, handlePointerDown],
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length === 2) {
        handlePinchMove(e.evt);
      } else {
        handlePointerMove(e);
      }
    },
    [handlePinchMove, handlePointerMove],
  );

  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      handlePinchEnd(e.evt);
    },
    [handlePinchEnd],
  );

  const handleItemChange = useCallback(
    (id: string, newAttributes: Partial<WhiteboardItem>) => {
      if (isMultiDragging(id)) {
        return;
      }

      performTransaction(() => {
        updateItem(id, newAttributes);

        const isGeometryChanged = GEOMETRY_KEYS.some(
          (key) => key in newAttributes,
        );
        if (!isGeometryChanged) return;

        const changedItem = items.find((item) => item.id === id);
        if (!changedItem || changedItem.type !== 'shape') return;

        if (selectedIds.length > 1 && selectedIds.includes(id)) {
          return;
        }

        const updatedShape = { ...changedItem, ...newAttributes } as ShapeItem;
        updateBoundArrows(id, updatedShape, items, updateItem);
      });
    },
    [items, updateItem, performTransaction, isMultiDragging, selectedIds],
  );

  const handleTransformMoveItem = useCallback(
    (
      id: string,
      x: number,
      y: number,
      w: number,
      h: number,
      rotation: number,
    ) => {
      setLocalDraggingId((prev) => (prev === id ? prev : id));
      setLocalDraggingPos((prev) => {
        if (
          prev &&
          prev.x === x &&
          prev.y === y &&
          prev.width === w &&
          prev.height === h &&
          prev.rotation === rotation
        ) {
          return prev;
        }
        return { x, y, width: w, height: h, rotation };
      });
    },
    [],
  );

  const handleDragMoveItem = useCallback(
    (id: string, x: number, y: number) => {
      const isMulti = updateMultiDrag(id, x, y);

      if (isMulti) return;

      const hasArrowBinding = items.some(
        (item) =>
          item.type === 'arrow' &&
          (item.startBinding?.elementId === id ||
            item.endBinding?.elementId === id),
      );

      if (hasArrowBinding) {
        setLocalDraggingId((prev) => (prev === id ? prev : id));
        setLocalDraggingPos((prev) => {
          if (prev && prev.x === x && prev.y === y) return prev;
          return { x, y };
        });
      }
    },
    [updateMultiDrag, items],
  );

  const handleDragEndItem = useCallback(() => {
    setIsDraggingArrow(false);
    setLocalDraggingId(null);
    setLocalDraggingPos(null);
    finishMultiDrag();
  }, [finishMultiDrag]);

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
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer
          name="main-layer"
          className="main-layer"
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
          {visibleItems.map((item) => {
            let displayItem = item;

            const multiDragPos = getMultiDragPosition(item.id);
            if (multiDragPos && 'x' in item && 'y' in item) {
              displayItem = {
                ...item,
                x: multiDragPos.x,
                y: multiDragPos.y,
              } as WhiteboardItem;
            }

            if (
              !multiDragPos &&
              item.type === 'arrow' &&
              localDraggingId &&
              localDraggingPos &&
              (item.startBinding?.elementId === localDraggingId ||
                item.endBinding?.elementId === localDraggingId)
            ) {
              const targetShape = items.find(
                (it) => it.id === localDraggingId,
              ) as ShapeItem;
              if (targetShape) {
                const tempPoints = getDraggingArrowPoints(
                  item as ArrowItem,
                  localDraggingId,
                  localDraggingPos.x,
                  localDraggingPos.y,
                  targetShape,
                  localDraggingPos.width,
                  localDraggingPos.height,
                  localDraggingPos.rotation,
                );
                if (tempPoints) {
                  displayItem = {
                    ...displayItem,
                    points: tempPoints,
                  } as WhiteboardItem;
                }
              }
            }

            if (
              displayItem.id === singleSelectedId &&
              (displayItem.type === 'arrow' || displayItem.type === 'line') &&
              draggingPoints
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
                isSelected={selectedIds.includes(item.id)}
                onSelect={handleSelectItem}
                onChange={(newAttributes) =>
                  handleItemChange(item.id, newAttributes)
                }
                onArrowDblClick={handleArrowDblClick}
                onShapeDblClick={handleShapeDblClick}
                onDragStart={() => {
                  if (item.type === 'arrow' || item.type === 'line') {
                    setIsDraggingArrow(true);
                  }
                  startMultiDrag(item.id);
                }}
                onDragMove={handleDragMoveItem}
                onTransformMove={handleTransformMoveItem}
                onDragEnd={handleDragEndItem}
              />
            );
          })}
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

          {/* 선택 박스 */}
          <SelectionBox />

          {/* 내 멀티 선택 개별 박스 */}
          {selectedIds.length > 1 &&
            selectedIds.map((itemId) => (
              <RemoteSelectionIndicator
                key={`my-selection-${itemId}`}
                selectedId={itemId}
                userColor="#0369A1"
                items={items}
                stageRef={stageRef}
              />
            ))}

          {/* 다른 사용자의 선택 표시 */}
          <RemoteSelectionLayer
            myUserId={myUserId}
            selectedId={singleSelectedId}
            items={items}
            stageRef={stageRef}
          />

          {/* 내 Transformer */}
          <ItemTransformer
            selectedIds={selectedIds}
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
              clearSelection();
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
              clearSelection();
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
