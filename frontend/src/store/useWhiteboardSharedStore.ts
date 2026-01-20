import { create } from 'zustand';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '@/components/whiteboard/constants/canvas';

import type { WhiteboardItem } from '@/types/whiteboard';

interface SharedState {
  items: WhiteboardItem[];
  canvasWidth: number;
  canvasHeight: number;
}

interface SharedActions {
  setItems: (items: WhiteboardItem[]) => void;
  setCanvasSize: (width: number, height: number) => void;
}

type SharedStore = SharedState & SharedActions;

// 공유 스토어 (화이트보드 아이템 목록, 캔버스 크기)
export const useWhiteboardSharedStore = create<SharedStore>((set) => ({
  // Whiteboard Items 초기값
  items: [],

  // Canvas 초기값
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,

  // Yjs 동기화 전용 액션
  setItems: (items) => set({ items }),
  setCanvasSize: (width, height) =>
    set({ canvasWidth: width, canvasHeight: height }),
}));
