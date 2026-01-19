import { useState } from 'react';
import Konva from 'konva';
import { useCanvasStore } from '@/store/useCanvasStore';

export function useEraser() {
  const cursorMode = useCanvasStore((state) => state.cursorMode);
  const deleteItem = useCanvasStore((state) => state.deleteItem);

  const [isErasing, setIsErasing] = useState(false);
  const [erasedIds, setErasedIds] = useState<Set<string>>(new Set());

  const handleEraserMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cursorMode !== 'eraser') return;

    setIsErasing(true);
    setErasedIds(new Set());

    // 클릭한 요소 삭제
    let target: Konva.Node = e.target;
    if (target !== e.target.getStage() && !target.hasName('bg-rect')) {
      // Group 내부 요소를 클릭한 경우 부모 Group 찾기(커스텀 화살표가 라인과 머리로 이루어진 그룹)
      if (target.parent && target.parent.hasName('arrow-group')) {
        target = target.parent;
      }

      const id = target.id();
      if (id) {
        deleteItem(id);
        setErasedIds((prev) => new Set(prev).add(id));
      }
    }
  };

  const handleEraserMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isErasing || cursorMode !== 'eraser') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // 현재 마우스 위치에 있는 요소
    let shape: Konva.Node | null = stage.getIntersection(pos);
    if (shape && shape.nodeType !== 'Stage' && !shape.hasName('bg-rect')) {
      // Group 내부 요소를 클릭한 경우 부모 Group 찾기(커스텀 화살표가 라인과 머리로 이루어진 그룹)
      if (shape.parent && shape.parent.hasName('arrow-group')) {
        shape = shape.parent;
      }

      const id = shape.id();
      if (id && !erasedIds.has(id)) {
        deleteItem(id);
        setErasedIds((prev) => new Set(prev).add(id));
      }
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
