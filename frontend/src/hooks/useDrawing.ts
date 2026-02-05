import { useState, useRef, useCallback } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { usePointerTracking } from '@/hooks/usePointerTracking';
import { DRAWING_SIZE_PRESETS } from '@/constants/drawingPresets';

export function useDrawing() {
  const startDrawing = useWhiteboardLocalStore((state) => state.startDrawing);
  const finishDrawing = useWhiteboardLocalStore((state) => state.finishDrawing);
  const drawingStroke = useWhiteboardLocalStore((state) => state.drawingStroke);
  const drawingSize = useWhiteboardLocalStore((state) => state.drawingSize);
  const { addDrawing } = useItemActions();

  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);
  const tempLineRef = useRef<Konva.Line | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  const handleDrawingStart = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
    point: { x: number; y: number },
  ) => {
    // 두 손가락 터치는 무시
    if ('touches' in e.evt && e.evt.touches.length >= 2) return;

    // 기존 아이템 클릭 시 그리기 시작 안 함
    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');
    if (!clickedOnEmpty) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const layer = stage.findOne('.main-layer') as Konva.Layer | undefined;
    if (!layer) return;

    // Konva Line
    const line = new Konva.Line({
      points: [point.x, point.y],
      stroke: drawingStroke,
      strokeWidth: DRAWING_SIZE_PRESETS[drawingSize].strokeWidth,
      tension: 0.5,
      lineCap: 'round',
      lineJoin: 'round',
    });

    layer.add(line);
    tempLineRef.current = line;
    layerRef.current = layer;
    stageRef.current = stage;

    setIsDrawing(true);
    startDrawing(point.x, point.y);
  };

  const handleMove = useCallback((x: number, y: number) => {
    if (!tempLineRef.current) return;

    const points = tempLineRef.current.points();
    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];
    const distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));

    if (distance < 2) return;

    tempLineRef.current.points([...points, x, y]);
    layerRef.current?.batchDraw();

    useWhiteboardLocalStore.getState().continueDrawing(x, y);
  }, []);

  const handleEnd = useCallback(() => {
    if (!tempLineRef.current) {
      setIsDrawing(false);
      return;
    }

    const points = tempLineRef.current.points();

    const drawing = useWhiteboardLocalStore.getState().currentDrawing;
    if (drawing && points.length >= 4) {
      addDrawing({ ...drawing, points });
    }

    tempLineRef.current.destroy();
    layerRef.current?.batchDraw();

    finishDrawing();
    tempLineRef.current = null;
    layerRef.current = null;
    stageRef.current = null;
    setIsDrawing(false);
  }, [addDrawing, finishDrawing]);

  // 그리기 취소 (핀치 줌 시작 시)
  const cancelDrawing = useCallback(() => {
    if (!isDrawing) return;

    if (tempLineRef.current) {
      tempLineRef.current.destroy();
      layerRef.current?.batchDraw();
    }

    setIsDrawing(false);
    finishDrawing();
    tempLineRef.current = null;
    layerRef.current = null;
    stageRef.current = null;
  }, [isDrawing, finishDrawing]);

  usePointerTracking({
    isActive: isDrawing,
    stageRef,
    onMove: handleMove,
    onEnd: handleEnd,
  });

  return {
    handleDrawingStart,
    cancelDrawing,
  };
}
