// cursor mode
export type CursorMode = 'select' | 'move' | 'draw' | 'eraser';

// text type
export type TextAlignment = 'left' | 'center' | 'right';
export type TextWrap = 'word' | 'char' | 'none';

// base item interface
export interface BaseItem {
  id: string;
  type: string;
}
