import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';

interface UseSelectionBoxProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  enabled: boolean;
}

export function useSelectionBox({ stageRef, enabled }: UseSelectionBoxProps) {
  const isDrawingRef = useRef(false);

  const selectMultiple = useWhiteboardLocalStore(
    (state) => state.selectMultiple,
  );

  const startSelectionBox = useCallback((x: number, y: number) => {
    useWhiteboardLocalStore.setState({
      selectionBox: {
        visible: true,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      },
    });
  }, []);

  const updateSelectionBox = useCallback((x: number, y: number) => {
    const state = useWhiteboardLocalStore.getState();
    if (!state.selectionBox) return;

    useWhiteboardLocalStore.setState({
      selectionBox: {
        ...state.selectionBox,
        x2: x,
        y2: y,
      },
    });
  }, []);

  const finishSelectionBox = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const state = useWhiteboardLocalStore.getState();
    const box = state.selectionBox;

    if (!box || !box.visible) {
      useWhiteboardLocalStore.setState({ selectionBox: null });
      return;
    }

    const boxRect = {
      x: Math.min(box.x1, box.x2),
      y: Math.min(box.y1, box.y2),
      width: Math.abs(box.x2 - box.x1),
      height: Math.abs(box.y2 - box.y1),
    };

    // 너무 작으면 선택 안함
    if (boxRect.width < 5 && boxRect.height < 5) {
      useWhiteboardLocalStore.setState({ selectionBox: null });
      return;
    }

    const itemNodes = stage.find('.whiteboard-item');
    const intersectedIds: string[] = [];

    itemNodes.forEach((node) => {
      const itemRect = node.getClientRect({
        relativeTo: stage,
        skipTransform: false,
        skipShadow: true,
      });

      if (Konva.Util.haveIntersection(boxRect, itemRect)) {
        intersectedIds.push(node.id());
      }
    });

    if (intersectedIds.length > 0) {
      selectMultiple(intersectedIds);
    }

    useWhiteboardLocalStore.setState({ selectionBox: null });
  }, [stageRef, selectMultiple]);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return null;

      const container = stage.container();
      const rect = container.getBoundingClientRect();

      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const transform = stage.getAbsoluteTransform().copy().invert();
      return transform.point({ x: screenX, y: screenY });
    },
    [stageRef],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      if (point) {
        updateSelectionBox(point.x, point.y);
      }
    };

    const handleMouseUp = () => {
      if (!isDrawingRef.current) return;

      isDrawingRef.current = false;
      finishSelectionBox();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawingRef.current || e.touches.length === 0) return;

      const touch = e.touches[0];
      const point = getCanvasPoint(touch.clientX, touch.clientY);
      if (point) {
        updateSelectionBox(point.x, point.y);
      }
    };

    const handleTouchEnd = () => {
      if (!isDrawingRef.current) return;

      isDrawingRef.current = false;
      finishSelectionBox();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, updateSelectionBox, finishSelectionBox, getCanvasPoint]);

  const startSelection = useCallback(
    (point: { x: number; y: number }) => {
      isDrawingRef.current = true;
      startSelectionBox(point.x, point.y);
    },
    [startSelectionBox],
  );

  const cancelSelection = useCallback(() => {
    isDrawingRef.current = false;
    useWhiteboardLocalStore.setState({ selectionBox: null });
  }, []);

  return {
    startSelection,
    cancelSelection,
  };
}
