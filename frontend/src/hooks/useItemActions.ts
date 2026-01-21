import { v4 as uuidv4 } from 'uuid';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/components/whiteboard/constants/canvas';

import type {
  WhiteboardItem,
  TextItem,
  ArrowItem,
  LineItem,
  ShapeItem,
  ShapeType,
  ImageItem,
  VideoItem,
  YoutubeItem,
} from '@/types/whiteboard';

import { extractYoutubeId } from '@/utils/youtube';

// 아이템 액션 훅
export function useItemActions() {
  // Store에서 Yjs 인스턴스 가져옴
  const yItems = useWhiteboardSharedStore((state) => state.yItems);

  // 텍스트 추가
  const addText = (payload?: Partial<Omit<TextItem, 'id' | 'type'>>) => {
    if (!yItems) {
      console.warn('[useItemActions] Yjs not initialized');
      return;
    }

    const id = uuidv4();
    const newText: TextItem = {
      id,
      type: 'text',
      x: payload?.x ?? CANVAS_WIDTH / 2,
      y: payload?.y ?? CANVAS_HEIGHT / 2,
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

    yItems.push([newText]);
    return id;
  };

  // 화살표 추가
  const addArrow = (payload?: Partial<Omit<ArrowItem, 'id' | 'type'>>) => {
    if (!yItems) return;

    const id = uuidv4();
    const newArrow: ArrowItem = {
      id,
      type: 'arrow',
      points: payload?.points ?? [
        CANVAS_WIDTH / 2 - 100,
        CANVAS_HEIGHT / 2,
        CANVAS_WIDTH / 2 + 100,
        CANVAS_HEIGHT / 2,
      ],
      stroke: payload?.stroke ?? '#111827',
      strokeWidth: payload?.strokeWidth ?? 4,
      pointerLength: payload?.pointerLength ?? 14,
      pointerWidth: payload?.pointerWidth ?? 14,
      tension: payload?.tension ?? 0.4,
    };

    yItems.push([newArrow]);
  };

  // 선 추가
  const addLine = (payload?: Partial<Omit<LineItem, 'id' | 'type'>>) => {
    if (!yItems) return;

    const id = uuidv4();
    const newLine: LineItem = {
      id,
      type: 'line',
      points: payload?.points ?? [
        CANVAS_WIDTH / 2 - 100,
        CANVAS_HEIGHT / 2,
        CANVAS_WIDTH / 2 + 100,
        CANVAS_HEIGHT / 2,
      ],
      stroke: payload?.stroke ?? '#111827',
      strokeWidth: payload?.strokeWidth ?? 4,
      tension: payload?.tension ?? 0.4,
    };

    yItems.push([newLine]);
  };

  // 도형 추가
  const addShape = (
    type: ShapeType,
    payload?: Partial<Omit<ShapeItem, 'id' | 'type' | 'shapeType'>>,
  ) => {
    if (!yItems) return;

    const id = uuidv4();
    const newShape: ShapeItem = {
      id,
      type: 'shape',
      shapeType: type,
      x: payload?.x ?? CANVAS_WIDTH / 2 - 50,
      y: payload?.y ?? CANVAS_HEIGHT / 2 - 50,
      width: payload?.width ?? 100,
      height: payload?.height ?? 100,
      fill: payload?.fill ?? '#ffffff',
      stroke: payload?.stroke ?? '#000000',
      strokeWidth: payload?.strokeWidth ?? 2,
      rotation: payload?.rotation ?? 0,
    };

    yItems.push([newShape]);
  };

  // 이미지 추가
  const addImage = (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => {
    if (!yItems) return;

    const id = uuidv4();
    const newImage: ImageItem = {
      id,
      type: 'image',
      src: payload.src,
      x: payload.x ?? CANVAS_WIDTH / 2 - 250,
      y: payload.y ?? CANVAS_HEIGHT / 2 - 125,
      width: payload.width ?? 500,
      height: payload.height ?? 250,
      rotation: 0,
      stroke: undefined,
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
    };

    yItems.push([newImage]);
  };

  // 비디오 추가
  const addVideo = (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => {
    if (!yItems) return;

    const id = uuidv4();
    const newVideo: VideoItem = {
      id,
      type: 'video',
      src: payload.src,
      x: payload.x ?? CANVAS_WIDTH / 2 - 250,
      y: payload.y ?? CANVAS_HEIGHT / 2 - 125,
      width: payload.width ?? 500,
      height: payload.height ?? 250,
      rotation: 0,
      stroke: undefined,
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
    };

    yItems.push([newVideo]);
  };

  // 유튜브 추가
  const addYoutube = (payload: { url: string; x?: number; y?: number }) => {
    if (!yItems) return;

    const videoId = extractYoutubeId(payload.url);

    if (!videoId) {
      alert('올바른 유튜브 URL이 아닙니다.');
      return;
    }

    const id = uuidv4();
    const width = 640;
    const height = 360;

    const newYoutube: YoutubeItem = {
      id,
      type: 'youtube',
      url: payload.url,
      videoId,
      x: payload.x ?? CANVAS_WIDTH / 2 - width / 2,
      y: payload.y ?? CANVAS_HEIGHT / 2 - height / 2,
      width,
      height,
      rotation: 0,
      stroke: undefined,
      strokeWidth: 0,
      cornerRadius: 10,
      opacity: 1,
    };

    yItems.push([newYoutube]);
  };

  // 그리기 완료 후 추가
  const addDrawing = (drawing: WhiteboardItem) => {
    if (!yItems) return;
    yItems.push([drawing]);
  };

  // 아이템 업데이트
  const updateItem = (id: string, changes: Partial<WhiteboardItem>) => {
    if (!yItems) return;

    const items = yItems.toArray();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;

    const updatedItem = { ...items[index], ...changes } as WhiteboardItem;

    // 트랜잭션 적용 (delete + insert를 하나의 업데이트로)
    const doc = yItems.doc;
    if (!doc) return;

    doc.transact(() => {
      yItems.delete(index, 1);
      yItems.insert(index, [updatedItem]);
    });
  };

  // 아이템 삭제
  const deleteItem = (id: string) => {
    if (!yItems) return;

    const items = yItems.toArray();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;

    yItems.delete(index, 1);
  };

  // 맨 앞으로
  const bringToFront = (id: string) => {
    if (!yItems) return;

    const items = yItems.toArray();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1 || index === items.length - 1) return;

    const item = items[index];
    const doc = yItems.doc;
    if (!doc) return;

    doc.transact(() => {
      yItems.delete(index, 1);
      yItems.push([item]);
    });
  };

  // 맨 뒤로
  const sendToBack = (id: string) => {
    if (!yItems) return;

    const items = yItems.toArray();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1 || index === 0) return;

    const item = items[index];
    const doc = yItems.doc;
    if (!doc) return;

    doc.transact(() => {
      yItems.delete(index, 1);
      yItems.insert(0, [item]);
    });
  };

  // 한 단계 앞으로
  const bringForward = (id: string) => {
    if (!yItems) return;

    const items = yItems.toArray();
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex === -1 || currentIndex === items.length - 1) return;

    const item = items[currentIndex];
    const doc = yItems.doc;
    if (!doc) return;

    doc.transact(() => {
      yItems.delete(currentIndex, 1);
      yItems.insert(currentIndex + 1, [item]);
    });
  };

  // 한 단계 뒤로
  const sendBackward = (id: string) => {
    if (!yItems) return;

    const items = yItems.toArray();
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex <= 0) return;

    const item = items[currentIndex];
    const doc = yItems.doc;
    if (!doc) return;

    doc.transact(() => {
      yItems.delete(currentIndex, 1);
      yItems.insert(currentIndex - 1, [item]);
    });
  };

  return {
    addText,
    addArrow,
    addLine,
    addShape,
    addImage,
    addVideo,
    addYoutube,
    addDrawing,
    updateItem,
    deleteItem,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  };
}
