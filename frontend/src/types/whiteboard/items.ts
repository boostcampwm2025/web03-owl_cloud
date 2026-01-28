import { BaseItem, TextAlignment, TextWrap } from '@/types/whiteboard/base';

// 화살표 머리 타입
export type ArrowHeadType =
  | 'none'
  | 'triangle'
  | 'chevron'
  | 'doubleChevron'
  | 'line';

export interface TextItem extends BaseItem {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  textDecoration?: string;
  fill: string;
  align: TextAlignment;
  wrap: TextWrap;
  rotation: number;
  width: number;
}

export interface ArrowItem extends BaseItem {
  type: 'arrow';
  points: number[];
  stroke: string;
  strokeWidth: number;
  pointerLength: number;
  pointerWidth: number;
  tension: number;
  startHeadType?: ArrowHeadType;
  endHeadType?: ArrowHeadType;
  chevronSpacing?: number;
}

export interface LineItem extends BaseItem {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
  tension: number;
}

export interface DrawingItem extends BaseItem {
  type: 'drawing';
  points: number[];
  stroke: string;
  strokeWidth: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

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
  opacity?: number;
  dash?: number[];
  cornerRadius?: number;
  // 텍스트 속성
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  textColor?: string;
  textAlign?: TextAlignment;
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
  dash?: number[];
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
  dash?: number[];
}

// youtube Item
export interface YoutubeItem extends BaseItem {
  type: 'youtube';
  // 원본 유튜브 URL
  url: string;
  // 유튜브 비디오 ID : 썸네일 표시용
  videoId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  opacity?: number;
  dash?: number[];
}

// stack item
export interface StackItem extends BaseItem {
  type: 'stack';
  src: string;
  stackName: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}
