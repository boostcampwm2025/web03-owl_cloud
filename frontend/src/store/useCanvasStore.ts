import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '@/components/whiteboard/constants/canvas';
import type { TextItem, ArrowItem, WhiteboardItem } from '@/types/whiteboard';

interface CanvasState {
  stageScale: number;
  stagePos: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;
  items: WhiteboardItem[];
  editingTextId: string | null;
  selectItem: (id: string | null) => void;

  selectedId: string | null;
  setStageScale: (scale: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setEditingTextId: (id: string | null) => void;

  addText: (text?: Partial<Omit<TextItem, 'id' | 'type'>>) => string;
  addArrow: (payload?: Partial<Omit<ArrowItem, 'id' | 'type'>>) => void;

  updateItem: (id: string, payload: Partial<WhiteboardItem>) => void;
  deleteItem: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  stageScale: 1,
  stagePos:
    typeof window !== 'undefined'
      ? {
          x: (window.innerWidth - CANVAS_WIDTH) / 2,
          y: (window.innerHeight - CANVAS_HEIGHT) / 2,
        }
      : { x: 0, y: 0 },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  items: [],
  editingTextId: null,
  selectedId: null,

  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePos: (pos) => set({ stagePos: pos }),
  selectItem: (id) => set({ selectedId: id }),

  // 텍스트 추가
  addText: (payload) => {
    const id = uuidv4();
    set((state) => {
      const newText: TextItem = {
        id,
        type: 'text',
        x: payload?.x ?? state.canvasWidth / 2,
        y: payload?.y ?? state.canvasHeight / 2,
        text: payload?.text ?? '새 텍스트',
        fontSize: payload?.fontSize ?? 32,
        fontFamily: payload?.fontFamily ?? 'Arial',
        fill: payload?.fill ?? '#111827',
        align: payload?.align ?? 'center',
        wrap: payload?.wrap ?? 'char',
        rotation: payload?.rotation ?? 0,
        width: payload?.width ?? 200,
        parentPolygonId: payload?.parentPolygonId,
      };

      return {
        items: [...state.items, newText],
      };
    });

    return id;
  },

  setEditingTextId: (id) => set({ editingTextId: id }),

  // 화살표 추가
  addArrow: (payload) =>
    set((state) => {
      const id = uuidv4();
      const newArrow: ArrowItem = {
        id,
        type: 'arrow',
        points: payload?.points ?? [
          state.canvasWidth / 2 - 100,
          state.canvasHeight / 2,
          state.canvasWidth / 2 + 100,
          state.canvasHeight / 2,
        ],
        stroke: payload?.stroke ?? '#111827',
        strokeWidth: payload?.strokeWidth ?? 3,
        pointerLength: payload?.pointerLength ?? 14,
        pointerWidth: payload?.pointerWidth ?? 14,
        tension: payload?.tension ?? 0.6,
      };

      return {
        items: [...state.items, newArrow],
      };
    }),

  // 아이템 업데이트
  updateItem: (id, payload) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? ({ ...item, ...payload } as WhiteboardItem) : item,
      ),
    })),

  // 아이템 삭제
  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      editingTextId: state.editingTextId === id ? null : state.editingTextId,
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  // 맨 앞으로
  bringToFront: (id) =>
    set((state) => {
      const index = state.items.findIndex((item) => item.id === id);
      if (index === -1 || index === state.items.length - 1) return state;

      const newItems = [...state.items];
      const [item] = newItems.splice(index, 1);
      newItems.push(item);

      return { items: newItems };
    }),

  // 맨 뒤로
  sendToBack: (id) =>
    set((state) => {
      const index = state.items.findIndex((item) => item.id === id);
      if (index === -1 || index === 0) return state;

      const newItems = [...state.items];
      const [item] = newItems.splice(index, 1);
      newItems.unshift(item);

      return { items: newItems };
    }),

  // 한 단계 앞으로
  bringForward: (id) =>
    set((state) => {
      const currentIndex = state.items.findIndex((item) => item.id === id);
      if (currentIndex === -1 || currentIndex === state.items.length - 1) {
        return state;
      }

      const newItems = [...state.items];
      [newItems[currentIndex], newItems[currentIndex + 1]] = [
        newItems[currentIndex + 1],
        newItems[currentIndex],
      ];

      return { items: newItems };
    }),

  // 한 단계 뒤로
  sendBackward: (id) =>
    set((state) => {
      const currentIndex = state.items.findIndex((item) => item.id === id);
      if (currentIndex <= 0) {
        return state;
      }

      const newItems = [...state.items];
      [newItems[currentIndex], newItems[currentIndex - 1]] = [
        newItems[currentIndex - 1],
        newItems[currentIndex],
      ];

      return { items: newItems };
    }),
}));
