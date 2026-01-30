import { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';

export function useDrawing() {
  const currentDrawing = useWhiteboardLocalStore(
    (state) => state.currentDrawing,
  );
  const startDrawing = useWhiteboardLocalStore((state) => state.startDrawing);
  const continueDrawing = useWhiteboardLocalStore(
    (state) => state.continueDrawing,
  );
  const finishDrawing = useWhiteboardLocalStore((state) => state.finishDrawing);
  const { addDrawing } = useItemActions();

  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);

  const handleDrawingStart = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
    point: { x: number; y: number },
  ) => {
    // 기존 아이템 클릭 시 그리기 시작 안 함
    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');
    if (!clickedOnEmpty) return;

    const stage = e.target.getStage();
    if (!stage) return;

    stageRef.current = stage;
    setIsDrawing(true);
    startDrawing(point.x, point.y);
  };

  // window 레벨에서 마우스/터치 이벤트 처리 (Stage 밖에서도 그리기 유지)
  useEffect(() => {
    if (!isDrawing || !stageRef.current) return;

    const stage = stageRef.current;
    const container = stage.container();
    const rect = container.getBoundingClientRect();

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 브라우저 좌표를 캔버스 좌표로 변환
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const x = (screenX - stage.x()) / stage.scaleX();
      const y = (screenY - stage.y()) / stage.scaleY();

      continueDrawing(x, y);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const x = (screenX - stage.x()) / stage.scaleX();
      const y = (screenY - stage.y()) / stage.scaleY();

      continueDrawing(x, y);
    };

    const handleGlobalEnd = () => {
      setIsDrawing(false);

      // 그리기 완료 시 아이템 추가
      const drawing = useWhiteboardLocalStore.getState().currentDrawing;
      if (drawing && drawing.points.length >= 4) {
        addDrawing(drawing);
      }

      finishDrawing();
      stageRef.current = null;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalTouchMove, {
      passive: false,
    });
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDrawing, continueDrawing, finishDrawing, addDrawing]);

  return {
    handleDrawingStart,
    currentDrawing,
  };
}
