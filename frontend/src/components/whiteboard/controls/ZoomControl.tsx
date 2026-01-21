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
  const stagePos = useWhiteboardLocalStore((state) => state.stagePos);
  const setStageScale = useWhiteboardLocalStore((state) => state.setStageScale);
  const setStagePos = useWhiteboardLocalStore((state) => state.setStagePos);

  // 줌 인
  const handleZoomIn = () => {
    const newScale = Math.min(stageScale + ZOOM_STEP, MAX_SCALE);
    zoomToCenter(newScale);
  };

  // 줌 아웃
  const handleZoomOut = () => {
    const newScale = Math.max(stageScale - ZOOM_STEP, MIN_SCALE);
    zoomToCenter(newScale);
  };

  // 화면 중앙을 기준으로 줌
  const zoomToCenter = (newScale: number) => {
    if (newScale === stageScale) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 현재 화면 중앙 캔버스 좌표 계산
    const pointTo = {
      x: (centerX - stagePos.x) / stageScale,
      y: (centerY - stagePos.y) / stageScale,
    };

    // 확대, 축소 후에도 같은 캔버스 좌표가 중앙에 오도록
    const newPos = {
      x: centerX - pointTo.x * newScale,
      y: centerY - pointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  };

  const zoomPercentage = Math.round(stageScale * 100);

  return (
    <div className="absolute right-4 bottom-4 z-50">
      <div className="flex items-center gap-2 rounded bg-neutral-800 p-2">
        <NavButton icon={ZoomOutIcon} label="축소" onClick={handleZoomOut} />

        <div className="flex h-8 w-20 items-center justify-center rounded bg-neutral-700 text-sm text-white">
          {zoomPercentage}%
        </div>

        <NavButton icon={ZoomInIcon} label="확대" onClick={handleZoomIn} />
      </div>
    </div>
  );
}
