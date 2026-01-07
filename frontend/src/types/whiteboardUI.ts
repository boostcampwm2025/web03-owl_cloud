// PanelType 정의 : 묶어져 있는 것들 -> Panel 형태로 제공
export type PanelType =
  | 'cursor'
  | 'shape'
  | 'arrow'
  | 'line'
  | 'text'
  | 'media'
  | 'stack'
  | null;

// ToolType 정의 : whiteboard에서 사용되는 모든 도구의 종류
// 마우스 동작(cursor) 관련 : move / select
// 도형(shape) 관련 : triangle / rectangle / diamond / circle / pentagon
// 선(line) 관련 : line
// 화살표(arrow) 관련 : arrow / doubleArrow / chevronArrow
// 그리기(draw) 관련 : draw
// 텍스트(text) 관련 : text
// 미디어(media) 관련 : image / video / youtube
// 지우개(eraser) 관련 : eraser
export type ToolType =
  | 'move'
  | 'select'
  | 'triangle'
  | 'rectangle'
  | 'diamond'
  | 'circle'
  | 'pentagon'
  | 'line'
  | 'arrow'
  | 'doubleArrow'
  | 'chevronArrow'
  | 'draw'
  | 'text'
  | 'image'
  | 'video'
  | 'youtube'
  | 'stack'
  | 'eraser';

export interface PanelProps {
  selectedTool: ToolType;
  onSelect: (tool: ToolType) => void;
}
