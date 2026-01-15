import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '@/components/whiteboard/constants/canvas';

import type {
  TextItem,
  ArrowItem,
  ShapeItem,
  ShapeType,
  ImageItem,
  VideoItem,
  WhiteboardItem,
} from '@/types/whiteboard';

interface CanvasState {
  // viewport State
  stageScale: number;
  stagePos: { x: number; y: number };

  // Canvas State
  canvasWidth: number;
  canvasHeight: number;

  // Whiteboard Items
  items: WhiteboardItem[];

  // Select
  selectedId: string | null;
  selectItem: (id: string | null) => void;

  // Stage Transform
  setStageScale: (scale: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;

  // Text Editing
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;

  // Item Actions
  addText: (text?: Partial<Omit<TextItem, 'id' | 'type'>>) => string;
  addArrow: (payload?: Partial<Omit<ArrowItem, 'id' | 'type'>>) => void;
  addShape: (
    type: ShapeType,
    payload?: Partial<Omit<ShapeItem, 'id' | 'type' | 'shapeType'>>,
  ) => void;
  addImage: (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => void;
  addVideo: (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => void;

  // Item Modification
  updateItem: (id: string, payload: Partial<WhiteboardItem>) => void;
  deleteItem: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // Stage State 초기값
  // StageScale : 줌 배율 / stagePos : 카메라 위치,중앙 정렬
  stageScale: 1,
  stagePos:
    typeof window !== 'undefined'
      ? {
          x: (window.innerWidth - CANVAS_WIDTH) / 2,
          y: (window.innerHeight - CANVAS_HEIGHT) / 2,
        }
      : { x: 0, y: 0 },

  // Canvas State 초기값
  // Canvas Width / Height : 캔버스 크기
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,

  // Whiteboard Items 초기값
  items: [],
  editingTextId: null,
  selectedId: null,

  // Stage Transform
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

  // 도형 추가
  addShape: (type, payload) =>
    set((state) => {
      const id = uuidv4();
      const newShape: ShapeItem = {
        id,
        type: 'shape',
        shapeType: type,
        x: payload?.x ?? state.canvasWidth / 2 - 50,
        y: payload?.y ?? state.canvasHeight / 2 - 50,
        width: payload?.width ?? 100,
        height: payload?.height ?? 100,
        fill: payload?.fill ?? '#ffffff',
        stroke: payload?.stroke ?? '#000000',
        strokeWidth: payload?.strokeWidth ?? 2,
        rotation: payload?.rotation ?? 0,
      };

      return {
        items: [...state.items, newShape],
        selectedId: id,
      };
    }),

  // 이미지 추가
  addImage: (payload) =>
    set((state) => {
      const id = uuidv4();
      const newImage: ImageItem = {
        id,
        type: 'image',
        src: payload.src,
        x: payload.x ?? state.canvasWidth / 2 - 250,
        y: payload.y ?? state.canvasHeight / 2 - 125,
        width: payload.width ?? 500,
        height: payload.height ?? 250,
        rotation: 0,
        stroke: undefined,
        strokeWidth: 0,
        cornerRadius: 0,
        opacity: 1,
      };

      return {
        items: [...state.items, newImage],
        selectedId: id,
      };
    }),

  // 비디오 추가
  addVideo: (payload) =>
    set((state) => {
      const id = uuidv4();
      const newVideo: VideoItem = {
        id,
        type: 'video',
        src: payload.src,
        x: payload.x ?? state.canvasWidth / 2 - 250,
        y: payload.y ?? state.canvasHeight / 2 - 125,
        width: payload.width ?? 500,
        height: payload.height ?? 250,
        rotation: 0,
        stroke: undefined,
        strokeWidth: 0,
        cornerRadius: 0,
        opacity: 1,
      };

      return {
        items: [...state.items, newVideo],
        selectedId: id,
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
