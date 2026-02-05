import { useState, useRef, useCallback } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { usePointerTracking } from '@/hooks/usePointerTracking';

// Group 내부 요소를 클릭한 경우 id가 있는 최상위 아이템 찾기
const findTopLevelItem = (node: Konva.Node): Konva.Node => {
  let target = node;
  while (target.parent && target.parent.nodeType !== 'Stage') {
    if (target.id()) break; // id가 있으면 최상위 아이템
    target = target.parent;
  }
  return target;
};

export function useEraser() {
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const { deleteItems } = useItemActions();

  const [isErasing, setIsErasing] = useState(false);
  const [erasedIds, setErasedIds] = useState<Set<string>>(new Set());
  const stageRef = useRef<Konva.Stage | null>(null);

  // 아이템 삭제 처리
  const eraseItem = useCallback(
    (target: Konva.Node) => {
      if (target.nodeType === 'Stage' || target.hasName('bg-rect')) return;

      const topLevelItem = findTopLevelItem(target);
      const id = topLevelItem.id();

      if (id && !erasedIds.has(id)) {
        // 지울 대상은 투명도 줌
        topLevelItem.opacity(0.3);
        setErasedIds((prev) => new Set(prev).add(id));
      }
    },
    [erasedIds],
  );

  // Canvas 좌표에서 아이템 찾아서 지우기
  const eraseAtPosition = useCallback(
    (x: number, y: number) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Canvas 좌표를 Stage 좌표로 변환
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const screenX = x * stageScale + stagePos.x;
      const screenY = y * stageScale + stagePos.y;

      // 해당 위치의 모든 아이템 찾기
      const shapes = stage.getAllIntersections({ x: screenX, y: screenY });
      shapes.forEach((shape) => {
        eraseItem(shape);
      });
    },
    [eraseItem],
  );

  const handleEraserStart = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (cursorMode !== 'eraser') return;

    // 두 손가락 터치는 무시
    if ('touches' in e.evt && e.evt.touches.length >= 2) {
      return;
    }

    const stage = e.target.getStage();
    if (!stage) return;

    stageRef.current = stage;
    setIsErasing(true);
    setErasedIds(new Set());
    eraseItem(e.target);
  };

  const handleMove = useCallback(
    (x: number, y: number) => {
      eraseAtPosition(x, y);
    },
    [eraseAtPosition],
  );

  const handleEnd = useCallback(() => {
    if (!isErasing) return;

    if (erasedIds.size > 0) {
      deleteItems(Array.from(erasedIds));
    }

    setIsErasing(false);
    setErasedIds(new Set());
    stageRef.current = null;
  }, [isErasing, erasedIds, deleteItems]);

  // 지우개 취소 (핀치 줌 시작 시)
  const cancelErasing = useCallback(() => {
    if (!isErasing) return;

    if (erasedIds.size > 0) {
      deleteItems(Array.from(erasedIds));
    }

    setIsErasing(false);
    setErasedIds(new Set());
    stageRef.current = null;
  }, [isErasing, erasedIds, deleteItems]);

  usePointerTracking({
    isActive: isErasing,
    stageRef,
    onMove: handleMove,
    onEnd: handleEnd,
  });

  return {
    handleEraserStart,
    cancelErasing,
    isErasing,
  };
}
