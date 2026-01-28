import Konva from 'konva';
import { useRef } from 'react';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useDrawing } from '@/hooks/useDrawing';
import { useEraser } from '@/hooks/useEraser';

interface UseCanvasMouseEventsProps {
  onDeselect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

export function useCanvasMouseEvents({
  onDeselect,
}: UseCanvasMouseEventsProps) {
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const lastCursorUpdateRef = useRef(0);

  const { handleDrawingMouseDown, currentDrawing } = useDrawing();

  const { handleEraserMouseDown, handleEraserMouseMove, handleEraserMouseUp } =
    useEraser();

  // 커서 위치 업데이트 (스로틀링 30ms)
  const updateCursor = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const now = Date.now();
    if (now - lastCursorUpdateRef.current < 30) return;
    lastCursorUpdateRef.current = now;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pointerPos);

    const awareness = useWhiteboardSharedStore.getState().awareness;
    if (!awareness) return;

    const currentState = awareness.getLocalState();
    if (currentState) {
      awareness.setLocalState({
        ...currentState,
        cursor: { x: canvasPos.x, y: canvasPos.y },
      });
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cursorMode === 'draw') {
      handleDrawingMouseDown(e);
    } else if (cursorMode === 'eraser') {
      handleEraserMouseDown(e);
    } else {
      onDeselect(e);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    updateCursor(e);

    if (cursorMode === 'eraser') {
      handleEraserMouseMove(e);
    }
  };

  const handleMouseUp = () => {
    if (cursorMode === 'eraser') {
      handleEraserMouseUp();
    }
  };

  const handleMouseLeave = () => {
    // 펜 그리기 중에는 Stage를 벗어나도 계속 그리기
    if (cursorMode === 'draw') {
      return;
    }

    if (cursorMode === 'eraser') {
      handleEraserMouseUp();
    }
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    currentDrawing,
  };
}
