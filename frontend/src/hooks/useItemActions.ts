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

// 아이템 액션 훅 / Yjs 연동 시 이 훅을 useYjsWebSocket에서 사용
export function useItemActions() {
  // 텍스트 추가
  const addText = (payload?: Partial<Omit<TextItem, 'id' | 'type'>>) => {
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

    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, newText] });

    return id;
  };

  // 화살표 추가
  const addArrow = (payload?: Partial<Omit<ArrowItem, 'id' | 'type'>>) => {
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

    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, newArrow] });
  };

  // 선 추가
  const addLine = (payload?: Partial<Omit<LineItem, 'id' | 'type'>>) => {
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

    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, newLine] });
  };

  // 도형 추가
  const addShape = (
    type: ShapeType,
    payload?: Partial<Omit<ShapeItem, 'id' | 'type' | 'shapeType'>>,
  ) => {
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

    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, newShape] });
  };

  // 이미지 추가
  const addImage = (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => {
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

    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, newImage] });
  };

  // 비디오 추가
  const addVideo = (payload: {
    src: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => {
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

    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, newVideo] });
  };

  // 유튜브 추가
  const addYoutube = (payload: { url: string; x?: number; y?: number }) => {
    const videoId = extractYoutubeId(payload.url);

    // 유효하지 않은 URL 입력시 alert 띄우고 중단
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

    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, newYoutube] });
  };

  // 그리기 완료 후 추가
  const addDrawing = (drawing: WhiteboardItem) => {
    // TODO: Yjs Doc에 추가
    const items = useWhiteboardSharedStore.getState().items;
    useWhiteboardSharedStore.setState({ items: [...items, drawing] });
  };

  // 아이템 업데이트
  const updateItem = (id: string, changes: Partial<WhiteboardItem>) => {
    // TODO: Yjs Doc 수정
    const items = useWhiteboardSharedStore.getState().items;
    const newItems = items.map((item) =>
      item.id === id ? ({ ...item, ...changes } as WhiteboardItem) : item,
    );
    useWhiteboardSharedStore.setState({ items: newItems });
  };

  // 아이템 삭제
  const deleteItem = (id: string) => {
    // TODO: Yjs Doc에서 삭제
    const items = useWhiteboardSharedStore.getState().items;
    const newItems = items.filter((item) => item.id !== id);
    useWhiteboardSharedStore.setState({ items: newItems });
  };

  // 맨 앞으로
  const bringToFront = (id: string) => {
    const items = useWhiteboardSharedStore.getState().items;
    const index = items.findIndex((item) => item.id === id);
    if (index === -1 || index === items.length - 1) return;

    const newItems = [...items];
    const [item] = newItems.splice(index, 1);
    newItems.push(item);

    // TODO: Yjs Doc 수정
    useWhiteboardSharedStore.setState({ items: newItems });
  };

  // 맨 뒤로
  const sendToBack = (id: string) => {
    const items = useWhiteboardSharedStore.getState().items;
    const index = items.findIndex((item) => item.id === id);
    if (index === -1 || index === 0) return;

    const newItems = [...items];
    const [item] = newItems.splice(index, 1);
    newItems.unshift(item);

    // TODO: Yjs Doc 수정
    useWhiteboardSharedStore.setState({ items: newItems });
  };

  // 한 단계 앞으로
  const bringForward = (id: string) => {
    const items = useWhiteboardSharedStore.getState().items;
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex === -1 || currentIndex === items.length - 1) return;

    const newItems = [...items];
    [newItems[currentIndex], newItems[currentIndex + 1]] = [
      newItems[currentIndex + 1],
      newItems[currentIndex],
    ];

    // TODO: Yjs Doc 수정
    useWhiteboardSharedStore.setState({ items: newItems });
  };

  // 한 단계 뒤로
  const sendBackward = (id: string) => {
    const items = useWhiteboardSharedStore.getState().items;
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex <= 0) return;

    const newItems = [...items];
    [newItems[currentIndex], newItems[currentIndex - 1]] = [
      newItems[currentIndex - 1],
      newItems[currentIndex],
    ];

    // TODO: Yjs Doc 수정
    useWhiteboardSharedStore.setState({ items: newItems });
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
