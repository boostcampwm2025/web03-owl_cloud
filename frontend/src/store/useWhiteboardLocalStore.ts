import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '@/components/whiteboard/constants/canvas';
import {
  DRAWING_SIZE_PRESETS,
  type DrawingSize,
} from '@/constants/drawingPresets';

import type { CursorMode, DrawingItem } from '@/types/whiteboard';

interface LocalState {
  selectedIds: string[];
  editingTextId: string | null;
  cursorMode: CursorMode;
  stageScale: number;
  stagePos: { x: number; y: number };
  viewportWidth: number;
  viewportHeight: number;
  currentDrawing: DrawingItem | null;
  drawingStroke: string;
  drawingSize: DrawingSize;
  awarenessCallback: ((selectedIds: string[]) => void) | null;
  cursorCallback: ((cursor: { x: number; y: number } | null) => void) | null;
  stageRef: React.RefObject<Konva.Stage | null> | null;
  selectionBox: {
    visible: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null;
}

interface LocalActions {
  selectOnly: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setEditingTextId: (id: string | null) => void;
  setCursorMode: (mode: CursorMode) => void;
  setStageScale: (scale: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setViewportSize: (width: number, height: number) => void;
  setDrawingStroke: (color: string) => void;
  setDrawingSize: (size: DrawingSize) => void;
  startDrawing: (x: number, y: number) => void;
  continueDrawing: (x: number, y: number) => void;
  finishDrawing: () => void;
  setAwarenessCallback: (
    callback: ((selectedIds: string[]) => void) | null,
  ) => void;
  setCursorCallback: (
    callback: ((cursor: { x: number; y: number } | null) => void) | null,
  ) => void;
  setStageRef: (ref: React.RefObject<Konva.Stage | null>) => void;
}

type LocalStore = LocalState & LocalActions;

// 개인 UI 상태(선택/편집 상태, 커서 모드, 뷰포트 (줌/팬), 임시 그리기)
export const useWhiteboardLocalStore = create<LocalStore>((set, get) => ({
  // Select 초기값
  selectedIds: [],
  awarenessCallback: null,
  cursorCallback: null,

  // 단일 선택
  selectOnly: (id) => {
    set({ selectedIds: [id] });
    const callback = get().awarenessCallback;
    if (callback) {
      callback([id]);
    }
  },

  // 멀티 선택
  selectMultiple: (ids) => {
    set({ selectedIds: ids });
    const callback = get().awarenessCallback;
    if (callback) {
      callback(ids);
    }
  },

  // 토글 선택 (Ctrl+클릭)
  toggleSelection: (id) => {
    const current = get().selectedIds;
    const newIds = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];

    set({ selectedIds: newIds });
    const callback = get().awarenessCallback;
    if (callback) {
      callback(newIds);
    }
  },

  // 선택 추가 (Shift+클릭)
  addToSelection: (id) => {
    const current = get().selectedIds;
    if (current.includes(id)) return;

    const newIds = [...current, id];
    set({ selectedIds: newIds });
    const callback = get().awarenessCallback;
    if (callback) {
      callback(newIds);
    }
  },

  // 선택 제거
  removeFromSelection: (id) => {
    const current = get().selectedIds;
    const newIds = current.filter((i) => i !== id);

    set({ selectedIds: newIds });
    const callback = get().awarenessCallback;
    if (callback) {
      callback(newIds);
    }
  },

  // 전체 선택 해제
  clearSelection: () => {
    set({ selectedIds: [] });
    const callback = get().awarenessCallback;
    if (callback) {
      callback([]);
    }
  },

  setAwarenessCallback: (callback) => set({ awarenessCallback: callback }),
  setCursorCallback: (callback) => set({ cursorCallback: callback }),

  // Text Editing 초기값
  editingTextId: null,
  setEditingTextId: (id) => set({ editingTextId: id }),

  // 커서 모드 초기값
  cursorMode: 'select',
  setCursorMode: (mode) => set({ cursorMode: mode }),

  // Stage State 초기값
  // StageScale : 줌 배율 / stagePos : 카메라 위치, 중앙 정렬
  stageScale: 1,
  stagePos:
    typeof window !== 'undefined'
      ? {
          x: (window.innerWidth - CANVAS_WIDTH) / 2,
          y: (window.innerHeight - CANVAS_HEIGHT) / 2,
        }
      : { x: 0, y: 0 },
  viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  stageRef: null,

  // Stage Transform
  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePos: (pos) => set({ stagePos: pos }),
  setViewportSize: (width, height) =>
    set({ viewportWidth: width, viewportHeight: height }),
  setStageRef: (ref) => set({ stageRef: ref }),

  // 그리기 초기값
  currentDrawing: null,
  drawingStroke: '#343a40', // 팔레트의 검정색
  drawingSize: 'M',

  setDrawingStroke: (color) => set({ drawingStroke: color }),
  setDrawingSize: (size) => set({ drawingSize: size }),

  // 그리기 시작
  startDrawing: (x, y) => {
    const state = get();
    const newDrawing: DrawingItem = {
      id: uuidv4(),
      type: 'drawing',
      points: [x, y],
      stroke: state.drawingStroke,
      strokeWidth: DRAWING_SIZE_PRESETS[state.drawingSize].strokeWidth,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };
    set({ currentDrawing: newDrawing });
  },

  continueDrawing: (x, y) => {
    const state = get();
    if (!state.currentDrawing) return;

    const updatedDrawing = {
      ...state.currentDrawing,
      points: [...state.currentDrawing.points, x, y],
    };

    set({ currentDrawing: updatedDrawing });
  },

  // 그리기 완료
  finishDrawing: () => set({ currentDrawing: null }),

  // 선택 박스 초기값
  selectionBox: null,
}));
