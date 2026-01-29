export * from '@/types/whiteboard/base';
export * from '@/types/whiteboard/items';

import {
  TextItem,
  ArrowItem,
  LineItem,
  DrawingItem,
  ShapeItem,
  ImageItem,
  StackItem,
} from '@/types/whiteboard/items';

export type WhiteboardItem =
  | TextItem
  | LineItem
  | ArrowItem
  | DrawingItem
  | ShapeItem
  | ImageItem
  | StackItem;
