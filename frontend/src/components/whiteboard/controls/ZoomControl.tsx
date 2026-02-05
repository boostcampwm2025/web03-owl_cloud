'use client';

import NavButton from '../common/NavButton';
import { ZoomOutIcon, ZoomInIcon } from '@/assets/icons/whiteboard';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import {
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_STEP,
} from '@/components/whiteboard/constants/canvas';

export default function ZoomControls() {
  const stageScale = useWhiteboardLocalStore((state) => state.stageScale);

  // 줌 인
  const handleZoomIn = () => {
    const { stageScale, stagePos, setStageScale, setStagePos } =
      useWhiteboardLocalStore.getState();
    const newScale = Math.min(stageScale + ZOOM_STEP, MAX_SCALE);
    zoomToCenter(newScale, stageScale, stagePos, setStageScale, setStagePos);
  };

  // 줌 아웃
  const handleZoomOut = () => {
    const { stageScale, stagePos, setStageScale, setStagePos } =
      useWhiteboardLocalStore.getState();
    const newScale = Math.max(stageScale - ZOOM_STEP, MIN_SCALE);
    zoomToCenter(newScale, stageScale, stagePos, setStageScale, setStagePos);
  };

  // 화면 중앙을 기준으로 줌
  const zoomToCenter = (
    newScale: number,
    currentScale: number,
    currentPos: { x: number; y: number },
    setStageScale: (scale: number) => void,
    setStagePos: (pos: { x: number; y: number }) => void,
  ) => {
    if (newScale === currentScale) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 현재 화면 중앙 캔버스 좌표 계산
    const pointTo = {
      x: (centerX - currentPos.x) / currentScale,
      y: (centerY - currentPos.y) / currentScale,
    };

    // 확대, 축소 후에도 같은 캔버스 좌표가 중앙에 오도록
    const newPos = {
      x: centerX - pointTo.x * newScale,
      y: centerY - pointTo.y * newScale,
    };

    // Stage 업데이트
    const { stageRef } = useWhiteboardLocalStore.getState();
    if (stageRef?.current) {
      stageRef.current.scale({ x: newScale, y: newScale });
      stageRef.current.position(newPos);
      stageRef.current.batchDraw();
    }

    setStageScale(newScale);
    setStagePos(newPos);
  };

  const zoomPercentage = Math.round(stageScale * 100);

  return (
    <div className="absolute right-4 bottom-4 z-1">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
        <NavButton icon={ZoomOutIcon} label="축소" onClick={handleZoomOut} />

        <div className="flex h-8 w-20 items-center justify-center rounded text-sm text-neutral-700 select-none">
          {zoomPercentage}%
        </div>

        <NavButton icon={ZoomInIcon} label="확대" onClick={handleZoomIn} />
      </div>
    </div>
  );
}
