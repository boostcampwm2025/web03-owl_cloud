export * from '@/types/whiteboard/base';
export * from '@/types/whiteboard/items';

import {
  TextItem,
  ArrowItem,
  ShapeItem,
  ImageItem,
} from '@/types/whiteboard/items';

export type WhiteboardItem = TextItem | ArrowItem | ShapeItem | ImageItem;
