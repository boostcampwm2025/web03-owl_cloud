import Konva from 'konva';

type CursorType =
  | 'move'
  | 'pointer'
  | 'crosshair'
  | 'default'
  | 'grab'
  | 'grabbing';

export function useCursorStyle(cursorType: CursorType = 'move') {
  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = cursorType;
    }
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = 'default';
    }
  };

  return { handleMouseEnter, handleMouseLeave };
}
