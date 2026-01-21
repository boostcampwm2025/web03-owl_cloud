import { useState } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';

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
  const { deleteItem } = useItemActions();

  const [isErasing, setIsErasing] = useState(false);
  const [erasedIds, setErasedIds] = useState<Set<string>>(new Set());

  // 아이템 삭제 처리
  const eraseItem = (target: Konva.Node) => {
    if (target.nodeType === 'Stage' || target.hasName('bg-rect')) return;

    const topLevelItem = findTopLevelItem(target);
    const id = topLevelItem.id();

    if (id && !erasedIds.has(id)) {
      deleteItem(id);
      setErasedIds((prev) => new Set(prev).add(id));
    }
  };

  const handleEraserMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cursorMode !== 'eraser') return;

    setIsErasing(true);
    setErasedIds(new Set());
    eraseItem(e.target);
  };

  const handleEraserMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isErasing || cursorMode !== 'eraser') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const shape = stage.getIntersection(pos);
    if (shape) {
      eraseItem(shape);
    }
  };

  const handleEraserMouseUp = () => {
    if (!isErasing) return;
    setIsErasing(false);
    setErasedIds(new Set());
  };

  return {
    handleEraserMouseDown,
    handleEraserMouseMove,
    handleEraserMouseUp,
    isErasing,
  };
}
