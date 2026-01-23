import { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { getWorldPointerPosition } from '@/utils/coordinate';

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

  const handleDrawingMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 기존 아이템 클릭 시 그리기 시작 안 함
    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');
    if (!clickedOnEmpty) return;

    const stage = e.target.getStage();
    if (!stage) return;

    stageRef.current = stage;
    const pos = getWorldPointerPosition(stage);
    setIsDrawing(true);
    startDrawing(pos.x, pos.y);
  };

  // window 레벨에서 마우스 이벤트 처리 (Stage 밖에서도 그리기 유지)
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

    const handleGlobalMouseUp = () => {
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
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawing, continueDrawing, finishDrawing, addDrawing]);

  return {
    handleDrawingMouseDown,
    currentDrawing,
  };
}
