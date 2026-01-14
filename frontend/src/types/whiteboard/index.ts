export * from '@/types/whiteboard/base';
export * from '@/types/whiteboard/items';

import {
  TextItem,
  ArrowItem,
  LineItem,
  DrawingItem,
  ShapeItem,
  ArrowHeadType,
} from '@/types/whiteboard/items';

export type { ArrowHeadType };

export type WhiteboardItem =
  | TextItem
  | ArrowItem
  | LineItem
  | DrawingItem
  | ShapeItem;
