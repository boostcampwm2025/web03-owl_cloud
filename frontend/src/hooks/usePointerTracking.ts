import { useEffect, useRef } from 'react';
import Konva from 'konva';

interface UsePointerTrackingProps {
  isActive: boolean;
  stageRef: React.RefObject<Konva.Stage | null>;
  onMove: (canvasX: number, canvasY: number) => void;
  onEnd: () => void;
}

export function usePointerTracking({
  isActive,
  stageRef,
  onMove,
  onEnd,
}: UsePointerTrackingProps) {
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    const container = stage.container();

    rectRef.current = container.getBoundingClientRect();
    const rect = rectRef.current;

    // 브라우저 좌표 → Canvas 좌표 변환
    const convertToCanvasCoords = (clientX: number, clientY: number) => {
      if (!rect) return null;

      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      const x = (screenX - stage.x()) / stage.scaleX();
      const y = (screenY - stage.y()) / stage.scaleY();

      return { x, y };
    };

    // 마우스 이동 핸들러
    const handleMouseMove = (e: MouseEvent) => {
      const coords = convertToCanvasCoords(e.clientX, e.clientY);
      if (coords) {
        onMove(coords.x, coords.y);
      }
    };

    // 터치 이동 핸들러
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const coords = convertToCanvasCoords(touch.clientX, touch.clientY);
      if (coords) {
        onMove(coords.x, coords.y);
      }
    };

    // 종료 핸들러
    const handleEnd = () => {
      onEnd();
    };

    // Window 레벨 이벤트 등록
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      rectRef.current = null;
    };
  }, [isActive, stageRef, onMove, onEnd]);
}
