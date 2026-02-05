import { renderHook } from '@testing-library/react';
import { useItemActions } from '../useItemActions';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import * as Y from 'yjs';
import type { YMapValue } from '@/types/whiteboard/yjs';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234',
}));

// 외부 스토어 모킹
jest.mock('@/store/useWhiteboardSharedStore');

// 타입 안전을 위한 모킹 함수 캐스팅
const mockedSharedStore = useWhiteboardSharedStore as unknown as jest.Mock;

describe('useItemActions', () => {
  let mockYArray: Y.Array<Y.Map<YMapValue>>;
  let mockDoc: Y.Doc;

  beforeEach(() => {
    jest.clearAllMocks();

    // 실제 Yjs 객체를 생성하여 내부 동작을 신뢰성 있게 테스트
    mockDoc = new Y.Doc();
    mockYArray = mockDoc.getArray<Y.Map<YMapValue>>('items');

    mockedSharedStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          yItems: mockYArray,
          yjsOrigin: 'local-client',
          items: [],
          setItems: jest.fn(),
        }),
    );

    (useWhiteboardSharedStore.getState as jest.Mock).mockReturnValue({
      items: [],
      setItems: jest.fn(),
    } as unknown as ReturnType<typeof useWhiteboardSharedStore.getState>);
  });

  it('[텍스트 추가 확인] addText 호출 시 Y.Array에 새로운 텍스트 맵이 추가되는가', () => {
    const { result } = renderHook(() => useItemActions());

    const textId = result.current.addText({ text: '테스트' });

    expect(textId).toBe('mocked-uuid-1234');
    expect(mockYArray.length).toBe(1);

    const addedItem = mockYArray.get(0);
    expect(addedItem.get('type')).toBe('text');
    expect(addedItem.get('text')).toBe('테스트');
  });

  it('[도형 추가 확인] addShape 호출 시 지정된 타입의 도형이 추가되는가', () => {
    const { result } = renderHook(() => useItemActions());

    result.current.addShape('rect', { fill: '#ff0000' });

    const addedItem = mockYArray.get(0);
    expect(addedItem.get('shapeType')).toBe('rect');
    expect(addedItem.get('fill')).toBe('#ff0000');
  });

  it('[아이템 삭제 확인] deleteItem 호출 시 해당 ID를 가진 아이템이 제거되는가', () => {
    const { result } = renderHook(() => useItemActions());

    const yMap = new Y.Map<YMapValue>();
    yMap.set('id', 'target-id');
    mockYArray.push([yMap]);

    result.current.deleteItem('target-id');

    expect(mockYArray.length).toBe(0);
  });

  it('[다중 삭제 확인] deleteItems 호출 시 여러 ID에 해당하는 아이템들이 제거되는가', () => {
    const { result } = renderHook(() => useItemActions());

    const item1 = new Y.Map<YMapValue>();
    item1.set('id', 'id-1');
    const item2 = new Y.Map<YMapValue>();
    item2.set('id', 'id-2');
    const item3 = new Y.Map<YMapValue>();
    item3.set('id', 'id-3');
    mockYArray.push([item1, item2, item3]);

    result.current.deleteItems(['id-1', 'id-3']);

    expect(mockYArray.length).toBe(1);
    expect(mockYArray.get(0).get('id')).toBe('id-2');
  });

  it('[순서 변경 확인] bringToFront 호출 시 아이템이 배열의 가장 마지막으로 이동하는가', () => {
    const { result } = renderHook(() => useItemActions());

    const item1 = new Y.Map<YMapValue>();
    item1.set('id', 'id-1');
    const item2 = new Y.Map<YMapValue>();
    item2.set('id', 'id-2');
    mockYArray.push([item1, item2]);

    result.current.bringToFront('id-1');

    expect(mockYArray.get(1).get('id')).toBe('id-1');
  });

  it('[업데이트 확인] updateItem 호출 시 Y.Map의 속성이 올바르게 수정되는가', () => {
    const { result } = renderHook(() => useItemActions());

    const item = new Y.Map<YMapValue>();
    item.set('id', 'id-1');
    item.set('x', 100);
    mockYArray.push([item]);

    result.current.updateItem('id-1', { x: 250, text: '수정됨' });

    const updatedItem = mockYArray.get(0);
    expect(updatedItem.get('x')).toBe(250);
    expect(updatedItem.get('text')).toBe('수정됨');
  });
});
