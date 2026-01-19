import Konva from 'konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useDrawing } from '@/hooks/useDrawing';
import { useEraser } from '@/hooks/useEraser';

interface UseCanvasMouseEventsProps {
  onDeselect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

export function useCanvasMouseEvents({
  onDeselect,
}: UseCanvasMouseEventsProps) {
  const cursorMode = useCanvasStore((state) => state.cursorMode);

  const {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    currentDrawing,
  } = useDrawing();

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
    if (cursorMode === 'draw') {
      handleDrawingMouseMove(e);
    } else if (cursorMode === 'eraser') {
      handleEraserMouseMove(e);
    }
  };

  const handleMouseUp = () => {
    if (cursorMode === 'draw') {
      handleDrawingMouseUp();
    } else if (cursorMode === 'eraser') {
      handleEraserMouseUp();
    }
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    currentDrawing,
  };
}
