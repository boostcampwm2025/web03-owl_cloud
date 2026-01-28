import { create } from 'zustand';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '@/components/whiteboard/constants/canvas';

import type { WhiteboardItem } from '@/types/whiteboard';
import type { YMapValue } from '@/types/whiteboard/yjs';

interface SharedState {
  items: WhiteboardItem[];
  canvasWidth: number;
  canvasHeight: number;
  yItems: Y.Array<Y.Map<YMapValue>> | null;
  awareness: awarenessProtocol.Awareness | null;
  undoManager: Y.UndoManager | null;
  yjsOrigin: string | null;
}

interface SharedActions {
  setItems: (items: WhiteboardItem[]) => void;
  setCanvasSize: (width: number, height: number) => void;
  setYjsInstances: (
    yItems: Y.Array<Y.Map<YMapValue>> | null,
    awareness: awarenessProtocol.Awareness | null,
    undoManager?: Y.UndoManager | null,
    yjsOrigin?: string | null,
  ) => void;
}

type SharedStore = SharedState & SharedActions;

// 공유 스토어 (화이트보드 아이템 목록, 캔버스 크기, Yjs 인스턴스)
export const useWhiteboardSharedStore = create<SharedStore>((set) => ({
  // Whiteboard Items 초기값
  items: [],

  // Canvas 초기값
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,

  // Yjs 인스턴스 초기값
  yItems: null,
  awareness: null,
  undoManager: null,
  yjsOrigin: null,

  // Yjs 동기화 전용 액션
  setItems: (items) => set({ items }),
  setCanvasSize: (width, height) =>
    set({ canvasWidth: width, canvasHeight: height }),

  // Yjs 인스턴스 설정
  setYjsInstances: (yItems, awareness, undoManager = null, yjsOrigin = null) =>
    set({ yItems, awareness, undoManager, yjsOrigin }),
}));
