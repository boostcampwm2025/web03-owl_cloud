import { useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import {
  MIN_SCALE,
  MAX_SCALE,
  SCALE_BY,
} from '@/components/whiteboard/constants/canvas';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const useCanvasInteraction = (
  windowWidth: number,
  windowHeight: number,
) => {
  const canvasWidth = useWhiteboardSharedStore((state) => state.canvasWidth);
  const canvasHeight = useWhiteboardSharedStore((state) => state.canvasHeight);
  const setStageScale = useWhiteboardLocalStore((state) => state.setStageScale);
  const setStagePos = useWhiteboardLocalStore((state) => state.setStagePos);

  // 스로틀링을 위한 ref
  const lastDragUpdateRef = useRef(0);
  const DRAG_UPDATE_INTERVAL = 16; // 60fps (16ms)

  // stage 위치를 화면 범위 내로 제한
  const constrainStagePosition = (
    pos: { x: number; y: number },
    scale: number,
  ) => {
    const scaledCanvasWidth = canvasWidth * scale;
    const scaledCanvasHeight = canvasHeight * scale;

    let x = pos.x;
    let y = pos.y;

    if (scaledCanvasWidth <= windowWidth) {
      x = (windowWidth - scaledCanvasWidth) / 2;
    } else {
      x = clamp(x, windowWidth - scaledCanvasWidth, 0);
    }

    if (scaledCanvasHeight <= windowHeight) {
      y = (windowHeight - scaledCanvasHeight) / 2;
    } else {
      y = clamp(y, windowHeight - scaledCanvasHeight, 0);
    }

    return { x, y };
  };

  // 줌 인/아웃, 스크롤
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    // Ctrl 키가 눌려있으면 줌
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // 줌 로직
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const rawScale =
        e.evt.deltaY < 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale));

      if (newScale === oldScale) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setStageScale(newScale);
      setStagePos(constrainStagePosition(newPos, newScale));
    } else if (e.evt.shiftKey) {
      // shift키 있으면 좌우 스크롤
      const currentPos = stage.position();
      const currentScale = stage.scaleX();
      const deltaX = e.evt.deltaX !== 0 ? e.evt.deltaX : e.evt.deltaY;

      const newPos = {
        x: currentPos.x - deltaX, // 좌우로 이동
        y: currentPos.y,
      };

      setStagePos(constrainStagePosition(newPos, currentScale));
    } else {
      // Ctrl 키가 없으면 캔버스 위아래 스크롤
      const currentPos = stage.position();
      const currentScale = stage.scaleX();

      const newPos = {
        x: currentPos.x,
        y: currentPos.y - e.evt.deltaY, // 위 아래 이동
      };

      setStagePos(constrainStagePosition(newPos, currentScale));
    }
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const constrainedPos = constrainStagePosition(
      stage.position(),
      stage.scaleX(),
    );
    stage.position(constrainedPos);

    // 스로틀링: 16ms마다만 store 업데이트
    const now = Date.now();
    if (now - lastDragUpdateRef.current >= DRAG_UPDATE_INTERVAL) {
      setStagePos(constrainedPos);
      lastDragUpdateRef.current = now;
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    setStagePos(stage.position());
  };

  return {
    handleWheel,
    handleDragMove,
    handleDragEnd,
  };
};
