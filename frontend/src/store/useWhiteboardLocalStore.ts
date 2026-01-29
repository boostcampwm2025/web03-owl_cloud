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
  selectedId: string | null;
  editingTextId: string | null;
  cursorMode: CursorMode;
  stageScale: number;
  stagePos: { x: number; y: number };
  viewportWidth: number;
  viewportHeight: number;
  currentDrawing: DrawingItem | null;
  drawingStroke: string;
  drawingSize: DrawingSize;
  awarenessCallback: ((selectedId: string | null) => void) | null;
  stageRef: React.RefObject<Konva.Stage | null> | null;
}

interface LocalActions {
  selectItem: (id: string | null) => void;
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
    callback: ((selectedId: string | null) => void) | null,
  ) => void;
  setStageRef: (ref: React.RefObject<Konva.Stage | null>) => void;
}

type LocalStore = LocalState & LocalActions;

// 개인 UI 상태(선택/편집 상태, 커서 모드, 뷰포트 (줌/팬), 임시 그리기)
export const useWhiteboardLocalStore = create<LocalStore>((set, get) => ({
  // Select 초기값
  selectedId: null,
  awarenessCallback: null,
  selectItem: (id) => {
    set({ selectedId: id });
    // Awareness 업데이트
    const callback = get().awarenessCallback;
    if (callback) {
      callback(id);
    }
  },
  setAwarenessCallback: (callback) => set({ awarenessCallback: callback }),

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

    const points = state.currentDrawing.points;
    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];

    // 최소 거리 체크 (성능 최적화)
    const distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
    if (distance < 2) return;

    const updatedDrawing = {
      ...state.currentDrawing,
      points: [...points, x, y],
    };

    set({ currentDrawing: updatedDrawing });
  },

  // 그리기 완료
  finishDrawing: () => set({ currentDrawing: null }),
}));
