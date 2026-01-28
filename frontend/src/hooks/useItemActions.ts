import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/components/whiteboard/constants/canvas';
import { TEXT_SIZE_PRESETS } from '@/constants/textPresets';

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
  StackItem,
} from '@/types/whiteboard';
import type { YMapValue } from '@/types/whiteboard/yjs';

import { extractYoutubeId } from '@/utils/youtube';

// 아이템 액션 훅
export function useItemActions() {
  // Store에서 Yjs 인스턴스 가져옴
  const yItems = useWhiteboardSharedStore((state) => state.yItems);
  const yjsOrigin = useWhiteboardSharedStore((state) => state.yjsOrigin);

  // WhiteboardItem → Y.Map 변환(WhiteboardItem 그대로 사용 x )
  const itemToYMap = (item: WhiteboardItem): Y.Map<YMapValue> => {
    const yMap = new Y.Map<YMapValue>();
    Object.entries(item).forEach(([key, value]) => {
      if (value !== undefined) {
        yMap.set(key, value as YMapValue);
      }
    });
    return yMap;
  };

  // Y.Map 복제 (delete 후 재삽입 시 필요함)
  const cloneYMap = (yMap: Y.Map<YMapValue>): Y.Map<YMapValue> => {
    const clone = new Y.Map<YMapValue>();
    yMap.forEach((value, key) => {
      clone.set(key, value);
    });
    return clone;
  };

  // z-order 변경
  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (!yItems?.doc) return;

    yItems.doc.transact(() => {
      const item = cloneYMap(yItems.get(fromIndex) as Y.Map<YMapValue>);
      yItems.delete(fromIndex, 1);
      yItems.insert(toIndex, [item]);
    }, yjsOrigin);
  };

  // 텍스트 추가
  const addText = (payload?: Partial<Omit<TextItem, 'id' | 'type'>>) => {
    if (!yItems || !yItems.doc) return;

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
    };

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newText)]);
    }, yjsOrigin);
    return id;
  };

  // 화살표 추가
  const addArrow = (payload?: Partial<Omit<ArrowItem, 'id' | 'type'>>) => {
    if (!yItems || !yItems.doc) return;

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

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newArrow)]);
    }, yjsOrigin);
  };

  // 선 추가
  const addLine = (payload?: Partial<Omit<LineItem, 'id' | 'type'>>) => {
    if (!yItems || !yItems.doc) return;

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

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newLine)]);
    }, yjsOrigin);
  };

  // 도형 추가
  const addShape = (
    type: ShapeType,
    payload?: Partial<Omit<ShapeItem, 'id' | 'type' | 'shapeType'>>,
  ) => {
    if (!yItems || !yItems.doc) return;

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
      fontSize: payload?.fontSize ?? TEXT_SIZE_PRESETS.S.fontSize,
    };

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newShape)]);
    }, yjsOrigin);
  };

  // 이미지 추가
  const addImage = (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => {
    if (!yItems || !yItems.doc) return;

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

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newImage)]);
    }, yjsOrigin);
  };

  // 비디오 추가
  const addVideo = (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => {
    if (!yItems || !yItems.doc) return;

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

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newVideo)]);
    }, yjsOrigin);
  };

  // 유튜브 추가
  const addYoutube = (payload: { url: string; x?: number; y?: number }) => {
    if (!yItems || !yItems.doc) return;

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

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newYoutube)]);
    }, yjsOrigin);
  };

  // 스택 아이템(아이콘) 추가
  const addStack = (payload: Partial<Omit<StackItem, 'id' | 'type'>>) => {
    if (!yItems || !yItems.doc) return;

    const id = uuidv4();
    const newStack: StackItem = {
      id,
      type: 'stack',
      src: payload.src ?? '',
      stackName: payload.stackName ?? '',
      category: payload.category ?? 'tool',
      x: payload.x ?? CANVAS_WIDTH / 2 - 30,
      y: payload.y ?? CANVAS_HEIGHT / 2 - 30,
      width: payload.width ?? 60,
      height: payload.height ?? 60,
      rotation: payload.rotation ?? 0,
      opacity: payload.opacity ?? 1,
    };

    yItems.doc.transact(() => {
      yItems.push([itemToYMap(newStack)]);
    }, yjsOrigin);

    return id;
  };

  // 그리기 완료 후 추가
  const addDrawing = (drawing: WhiteboardItem) => {
    if (!yItems || !yItems.doc) return;
    yItems.doc.transact(() => {
      yItems.push([itemToYMap(drawing)]);
    }, yjsOrigin);
  };

  // 아이템 업데이트 (Y.Map 속성 직접 수정 - Undo 스택 유지)
  const updateItem = (id: string, changes: Partial<WhiteboardItem>) => {
    if (!yItems || !yItems.doc) return;

    const yMaps = yItems.toArray();
    const index = yMaps.findIndex((yMap) => yMap.get('id') === id);
    if (index === -1) return;

    const yMap = yMaps[index];

    yItems.doc.transact(() => {
      Object.entries(changes).forEach(([key, value]) => {
        if (value !== undefined) {
          yMap.set(key, value);
        }
      });
    }, yjsOrigin);
  };

  // 아이템 삭제
  const deleteItem = (id: string) => {
    if (!yItems || !yItems.doc) return;

    const yMaps = yItems.toArray();
    const index = yMaps.findIndex((yMap) => yMap.get('id') === id);
    if (index === -1) return;

    yItems.doc.transact(() => {
      yItems.delete(index, 1);
    }, yjsOrigin);
  };

  // 여러 아이템 한번에 삭제 (지우개로 빠르게 각각 삭제하니까 몇 몇 아이템이 동기화가 안되는 문제가 있음)
  const deleteItems = (ids: string[]) => {
    if (!yItems || !yItems.doc || ids.length === 0) return;

    yItems.doc.transact(() => {
      const yMaps = yItems.toArray();
      const idsToDelete = new Set(ids);

      // 역순으로 순회하면서 삭제
      for (let index = yMaps.length - 1; index >= 0; index--) {
        const id = yMaps[index].get('id');
        if (id && idsToDelete.has(id as string)) {
          yItems.delete(index, 1);
        }
      }
    }, yjsOrigin);
  };

  // 맨 앞으로
  const bringToFront = (id: string) => {
    if (!yItems) return;

    const yMaps = yItems.toArray();
    const index = yMaps.findIndex((yMap) => yMap?.get('id') === id);
    if (index === -1 || index === yMaps.length - 1) return;

    reorderItems(index, yMaps.length - 1);
  };

  // 맨 뒤로
  const sendToBack = (id: string) => {
    if (!yItems) return;

    const yMaps = yItems.toArray();
    const index = yMaps.findIndex((yMap) => yMap?.get('id') === id);
    if (index === -1 || index === 0) return;

    reorderItems(index, 0);
  };

  // 한 단계 앞으로
  const bringForward = (id: string) => {
    if (!yItems) return;

    const yMaps = yItems.toArray();
    const index = yMaps.findIndex((yMap) => yMap?.get('id') === id);
    if (index === -1 || index === yMaps.length - 1) return;

    reorderItems(index, index + 1);
  };

  // 한 단계 뒤로
  const sendBackward = (id: string) => {
    if (!yItems) return;

    const yMaps = yItems.toArray();
    const index = yMaps.findIndex((yMap) => yMap?.get('id') === id);
    if (index <= 0) return;

    reorderItems(index, index - 1);
  };

  return {
    addText,
    addArrow,
    addLine,
    addShape,
    addImage,
    addVideo,
    addYoutube,
    addStack,
    addDrawing,
    updateItem,
    deleteItem,
    deleteItems,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  };
}
