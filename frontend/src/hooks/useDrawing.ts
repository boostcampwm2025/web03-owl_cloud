import { useState } from 'react';
import Konva from 'konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import { getWorldPointerPosition } from '@/utils/coordinate';

export function useDrawing() {
  const cursorMode = useCanvasStore((state) => state.cursorMode);
  const currentDrawing = useCanvasStore((state) => state.currentDrawing);
  const startDrawing = useCanvasStore((state) => state.startDrawing);
  const continueDrawing = useCanvasStore((state) => state.continueDrawing);
  const finishDrawing = useCanvasStore((state) => state.finishDrawing);

  const [isDrawing, setIsDrawing] = useState(false);

  const handleDrawingMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cursorMode !== 'draw') return;

    // 기존 아이템 클릭 시 그리기 시작 안 함
    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');
    if (!clickedOnEmpty) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = getWorldPointerPosition(stage);
    setIsDrawing(true);
    startDrawing(pos.x, pos.y);
  };

  const handleDrawingMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || cursorMode !== 'draw') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = getWorldPointerPosition(stage);
    continueDrawing(pos.x, pos.y);
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    finishDrawing();
  };

  return {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    currentDrawing,
  };
}
