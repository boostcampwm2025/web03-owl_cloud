import { useCallback, useRef, useState } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import type { CursorMode } from '@/types/whiteboard/base';

interface UsePinchZoomProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  onScaleChange: (scale: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onPinchStart?: () => void;
}

export function usePinchZoom({
  stageRef,
  onScaleChange,
  onPositionChange,
  onPinchStart,
}: UsePinchZoomProps) {
  const [isActive, setIsActive] = useState(false);
  const lastDistanceRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const previousModeRef = useRef<CursorMode | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2) return;

      const [t1, t2] = e.touches;
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;

      setIsActive(true);
      centerRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      lastDistanceRef.current = Math.sqrt(dx * dx + dy * dy);

      // 커서 모드를 임시로 move로 변경
      const store = useWhiteboardLocalStore.getState();
      if (store.cursorMode !== 'move') {
        previousModeRef.current = store.cursorMode;
        store.setCursorMode('move');
      }

      onPinchStart?.();
    },
    [onPinchStart],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isActive) return;
      if (e.touches.length !== 2) return;
      if (!centerRef.current || !lastDistanceRef.current) return;

      const stage = stageRef.current;
      if (!stage) return;

      e.preventDefault();

      const [t1, t2] = e.touches;
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);

      const oldScale = stage.scaleX();
      const newScale = Math.max(
        0.1,
        Math.min(10, oldScale * (newDistance / lastDistanceRef.current)),
      );

      const stagePos = stage.position();
      const center = centerRef.current;
      const pointToX = (center.x - stagePos.x) / oldScale;
      const pointToY = (center.y - stagePos.y) / oldScale;

      const newPos = {
        x: center.x - pointToX * newScale,
        y: center.y - pointToY * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();

      onScaleChange(newScale);
      onPositionChange(newPos);

      lastDistanceRef.current = newDistance;
    },
    [isActive, stageRef, onScaleChange, onPositionChange],
  );

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length >= 2) return;

    setIsActive(false);
    centerRef.current = null;
    lastDistanceRef.current = null;

    if (previousModeRef.current) {
      useWhiteboardLocalStore.getState().setCursorMode(previousModeRef.current);
      previousModeRef.current = null;
    }
  }, []);

  return {
    isActive,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
