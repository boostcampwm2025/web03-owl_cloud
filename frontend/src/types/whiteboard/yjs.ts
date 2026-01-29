import { ArrowBinding } from './items';

// Yjs Y.Map의 value 타입
// WhiteboardItem의 모든 속성 값 타입을 포함
export type YMapValue =
  | string
  | number
  | number[]
  | boolean
  | undefined
  | ArrowBinding;
