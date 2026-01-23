import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useDrawing } from '@/hooks/useDrawing';
import { useEraser } from '@/hooks/useEraser';

interface UseCanvasMouseEventsProps {
  onDeselect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

export function useCanvasMouseEvents({
  onDeselect,
}: UseCanvasMouseEventsProps) {
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);

  const { handleDrawingMouseDown, currentDrawing } = useDrawing();

  const { handleEraserMouseDown, handleEraserMouseMove, handleEraserMouseUp } =
    useEraser();

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
