import type {
  ArrowItem,
  LineItem,
  TextItem,
  DrawingItem,
} from '@/types/whiteboard';
import type { ArrowSize, ArrowStyle } from '@/constants/arrowPresets';
import type { TextSize } from '@/constants/textPresets';
import type { DrawingSize } from '@/constants/drawingPresets';

// 현재 Arrow 사이즈 결정
export function getArrowSize(arrow: ArrowItem): ArrowSize {
  if (arrow.strokeWidth <= 2 && arrow.pointerLength <= 8) return 'S';
  if (arrow.strokeWidth <= 4 && arrow.pointerLength <= 14) return 'M';
  return 'L';
}

// 현재 Line 사이즈 결정
export function getLineSize(line: LineItem): ArrowSize {
  if (line.strokeWidth <= 2) return 'S';
  if (line.strokeWidth <= 4) return 'M';
  return 'L';
}

// 현재 Text 사이즈 결정
export function getTextSize(text: TextItem): TextSize {
  if (text.fontSize <= 16) return 'S';
  if (text.fontSize <= 32) return 'M';
  if (text.fontSize <= 64) return 'L';
  return 'XL';
}

// 현재 Drawing 사이즈 결정
export function getDrawingSize(drawing: DrawingItem): DrawingSize {
  if (drawing.strokeWidth <= 4) return 'S';
  if (drawing.strokeWidth <= 12) return 'M';
  return 'L';
}

// 현재 arrow/line 스타일 결정
export function getItemStyle(item: ArrowItem | LineItem): ArrowStyle {
  return item.tension === 0 ? 'straight' : 'curved';
}
