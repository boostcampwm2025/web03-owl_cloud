import { BaseItem, TextAlignment, TextWrap } from '@/types/whiteboard/base';

// Text Item
export interface TextItem extends BaseItem {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: TextAlignment;
  wrap: TextWrap;
  rotation: number;
  width: number;
  parentPolygonId?: string;
}

// Arrow Item
export interface ArrowItem extends BaseItem {
  type: 'arrow';
  points: number[];
  stroke: string;
  strokeWidth: number;
  pointerLength: number;
  pointerWidth: number;
  tension: number;
}

// Shape Item
export type ShapeType = 'rect' | 'circle' | 'triangle' | 'diamond' | 'pentagon';

export interface ShapeItem extends BaseItem {
  type: 'shape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
}

// Image Item
export interface ImageItem extends BaseItem {
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  opacity?: number;
}

// Video Item
export interface VideoItem extends BaseItem {
  type: 'video';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  opacity?: number;
}
