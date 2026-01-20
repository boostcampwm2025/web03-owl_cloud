import Konva from 'konva';
import { useCanvasStore } from '@/store/useCanvasStore';

type CursorType =
  | 'move'
  | 'pointer'
  | 'crosshair'
  | 'default'
  | 'grab'
  | 'grabbing';

export function useCursorStyle(cursorType: CursorType = 'move') {
  const cursorMode = useCanvasStore((state) => state.cursorMode);

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cursorMode !== 'select') return;

    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = cursorType;
    }
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cursorMode !== 'select') return;

    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = '';
    }
  };

  return { handleMouseEnter, handleMouseLeave };
}
