import Konva from 'konva';
import { useRef } from 'react';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useDrawing } from '@/hooks/useDrawing';
import { useEraser } from '@/hooks/useEraser';

interface UseCanvasMouseEventsProps {
  onDeselect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

// 캔버스 좌표 추출 (마우스/터치 통합 사용 위함)
function getCanvasPoint(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  const stage = e.target.getStage();
  if (!stage) return null;

  const pointerPos = stage.getPointerPosition();
  if (!pointerPos) return null;

  const transform = stage.getAbsoluteTransform().copy().invert();
  return transform.point(pointerPos);
}

export function useCanvasMouseEvents({
  onDeselect,
}: UseCanvasMouseEventsProps) {
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const lastCursorUpdateRef = useRef(0);

  const { handleDrawingStart, currentDrawing } = useDrawing();
  const { handleEraserStart, handleEraserMove, handleEraserEnd } = useEraser();

  // 커서 위치 업데이트 (스로틀링 30ms)
  const updateCursor = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const now = Date.now();
    if (now - lastCursorUpdateRef.current < 30) return;
    lastCursorUpdateRef.current = now;

    const point = getCanvasPoint(e);
    if (!point) return;

    const cursorCallback = useWhiteboardLocalStore.getState().cursorCallback;
    if (cursorCallback) {
      cursorCallback({ x: point.x, y: point.y });
    }
  };

  const handlePointerDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    if (cursorMode === 'draw') {
      handleDrawingStart(e, point);
    } else if (cursorMode === 'eraser') {
      handleEraserStart(e, point);
    } else {
      onDeselect(e);
    }
  };

  const handlePointerMove = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    updateCursor(e);

    if (cursorMode === 'eraser') {
      const point = getCanvasPoint(e);
      if (point) {
        handleEraserMove(e, point);
      }
    }
  };

  const handlePointerUp = () => {
    if (cursorMode === 'eraser') {
      handleEraserEnd();
    }
  };

  const handlePointerLeave = () => {
    // 펜 그리기 중에는 Stage를 벗어나도 계속 그리기
    if (cursorMode === 'draw') {
      return;
    }

    if (cursorMode === 'eraser') {
      handleEraserEnd();
    }
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    currentDrawing,
  };
}
