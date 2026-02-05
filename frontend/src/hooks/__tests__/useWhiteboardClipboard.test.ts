import { renderHook, act } from '@testing-library/react';
import { useWhiteboardClipboard } from '../useWhiteboardClipboard';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useItemActions } from '@/hooks/useItemActions';
import * as Y from 'yjs';
import type { YMapValue } from '@/types/whiteboard/yjs';

// ESM 에러 방지를 위한 uuid 모킹
jest.mock('uuid', () => ({
  v4: () => 'new-uuid-1234',
}));

// 외부 의존성 모킹
jest.mock('@/store/useWhiteboardLocalStore');
jest.mock('@/store/useWhiteboardSharedStore');
jest.mock('@/hooks/useItemActions');

const mockedLocalStore = useWhiteboardLocalStore as unknown as jest.Mock;
const mockedSharedStore = useWhiteboardSharedStore as unknown as jest.Mock;
const mockedUseItemActions = useItemActions as jest.MockedFunction<
  typeof useItemActions
>;

describe('useWhiteboardClipboard', () => {
  let mockYArray: Y.Array<Y.Map<YMapValue>>;
  let mockDoc: Y.Doc;
  const mockSelectMultiple = jest.fn();
  const mockPerformTransaction = jest.fn((fn: () => void) => fn());

  beforeEach(() => {
    jest.clearAllMocks();

    mockDoc = new Y.Doc();
    mockYArray = mockDoc.getArray<Y.Map<YMapValue>>('items');

    // Item Actions 모킹
    mockedUseItemActions.mockReturnValue({
      performTransaction: mockPerformTransaction,
    } as unknown as ReturnType<typeof useItemActions>);
  });

  const setupMocks = (selectedIds: string[], items: unknown[]) => {
    mockedLocalStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          selectedIds,
          selectMultiple: mockSelectMultiple,
        }),
    );

    mockedSharedStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          items,
          yItems: mockYArray,
        }),
    );
  };

  it('[복사 및 붙여넣기 확인] copy 후 paste 시 좌표가 30만큼 이동된 새 아이템이 생성되는가', () => {
    // 테스트 데이터 주입
    setupMocks(['item-1'], [{ id: 'item-1', type: 'rect', x: 100, y: 100 }]);

    const { result } = renderHook(() => useWhiteboardClipboard());

    // 복사 실행
    act(() => {
      result.current.copy();
    });

    // 붙여넣기 실행
    act(() => {
      result.current.paste();
    });

    // Yjs 배열에 아이템이 추가되었는가 확인
    expect(mockYArray.length).toBe(1);

    const pastedItem = mockYArray.get(0);
    expect(pastedItem?.get('id')).toBe('new-uuid-1234');
    expect(pastedItem?.get('x')).toBe(130);
    expect(pastedItem?.get('y')).toBe(130);

    // 새로 생성된 아이디로 선택이 전환되었는가 확인
    expect(mockSelectMultiple).toHaveBeenCalledWith(['new-uuid-1234']);
  });

  it('[빈 선택 상태 확인] 선택된 아이템이 없을 때 copy를 호출하면 클립보드가 업데이트되지 않는가', () => {
    // 선택된 아이템이 없는 상태로 변경
    setupMocks([], [{ id: 'item-1', type: 'rect', x: 100, y: 100 }]);

    const { result } = renderHook(() => useWhiteboardClipboard());

    act(() => {
      result.current.copy();
    });

    act(() => {
      result.current.paste();
    });

    // 아이템이 추가되지 않아야 함 확인
    expect(mockYArray.length).toBe(0);
    expect(mockSelectMultiple).not.toHaveBeenCalled();
  });

  it('[드로잉 아이템 확인] drawing 타입 아이템의 경우 points 좌표들이 모두 이동되는가', () => {
    // 드로잉 아이템으로 상태 변경
    setupMocks(
      ['drawing-1'],
      [{ id: 'drawing-1', type: 'drawing', points: [10, 20, 30, 40] }],
    );

    const { result } = renderHook(() => useWhiteboardClipboard());

    // 복사 실행
    act(() => {
      result.current.copy();
    });

    // 붙여넣기 실행
    act(() => {
      result.current.paste();
    });

    // 데이터가 생성되었는지 확인 후 좌표 검증
    expect(mockYArray.length).toBe(1);

    const pastedItem = mockYArray.get(0);
    expect(pastedItem).toBeDefined();

    if (pastedItem) {
      const points = pastedItem.get('points') as number[];
      // 모든 좌표가 30씩 이동했는지 확인
      expect(points).toEqual([40, 50, 60, 70]);
    }
  });
});
