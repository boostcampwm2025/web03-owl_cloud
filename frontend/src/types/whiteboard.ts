export type TextAlignment = 'left' | 'center' | 'right';
export type TextWrap = 'word' | 'char' | 'none';

interface BaseItem {
  id: string;
  type: 'text' | 'arrow';
}

// 텍스트 아이템
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

// 화살표 아이템
export interface ArrowItem extends BaseItem {
  type: 'arrow';
  points: number[];
  stroke: string;
  strokeWidth: number;
  pointerLength: number;
  pointerWidth: number;
  tension: number;
}

// 통합 타입
export type WhiteboardItem = TextItem | ArrowItem;
