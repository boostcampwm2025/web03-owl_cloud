import { Rect } from 'react-konva';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';

export default function SelectionBox() {
  const selectionBox = useWhiteboardLocalStore((state) => state.selectionBox);

  if (!selectionBox || !selectionBox.visible) return null;

  const x = Math.min(selectionBox.x1, selectionBox.x2);
  const y = Math.min(selectionBox.y1, selectionBox.y2);
  const width = Math.abs(selectionBox.x2 - selectionBox.x1);
  const height = Math.abs(selectionBox.y2 - selectionBox.y1);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 123, 255, 0.08)"
      stroke="#007bff"
      strokeWidth={2}
      dash={[8, 4]}
      listening={false}
    />
  );
}
