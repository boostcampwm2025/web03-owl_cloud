import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { WhiteboardItem } from '@/types/whiteboard';
import { YMapValue } from '@/types/whiteboard/yjs';

describe('useWhiteboardSharedStore', () => {
  beforeEach(() => {
    const state = useWhiteboardSharedStore.getState();
    state.setItems([]);
    state.setYjsInstances(null, null, null, null);
  });

  it('[아이템 목록 업데이트 확인] setItems를 통해 아이템 목록을 업데이트할 수 있는가', () => {
    const mockItems: WhiteboardItem[] = [
      {
        id: '1',
        type: 'text',
        x: 0,
        y: 0,
        text: 'Hello',
        fontSize: 32,
        fontFamily: 'Arial',
        fill: '#000',
        align: 'center',
        width: 100,
        rotation: 0,
        wrap: 'char',
      } as WhiteboardItem,
    ];

    useWhiteboardSharedStore.getState().setItems(mockItems);

    expect(useWhiteboardSharedStore.getState().items).toEqual(mockItems);
  });

  it('[캔버스 크기 변경 확인] setCanvasSize를 통해 캔버스 크기를 변경할 수 있는가', () => {
    useWhiteboardSharedStore.getState().setCanvasSize(1920, 1080);

    expect(useWhiteboardSharedStore.getState().canvasWidth).toBe(1920);
    expect(useWhiteboardSharedStore.getState().canvasHeight).toBe(1080);
  });

  it('[Yjs 인스턴스 설정 확인] setYjsInstances를 통해 Yjs 관련 인스턴스들을 설정할 수 있는가', () => {
    const doc = new Y.Doc();
    const yItems = doc.getArray<Y.Map<YMapValue>>('items');

    const awareness = new awarenessProtocol.Awareness(doc);
    const undoManager = new Y.UndoManager(yItems);
    const origin = 'client-id-123';

    useWhiteboardSharedStore
      .getState()
      .setYjsInstances(yItems, awareness, undoManager, origin);

    const state = useWhiteboardSharedStore.getState();
    expect(state.yItems).toBe(yItems);
    expect(state.awareness).toBe(awareness);
    expect(state.undoManager).toBe(undoManager);
    expect(state.yjsOrigin).toBe(origin);
  });
});
