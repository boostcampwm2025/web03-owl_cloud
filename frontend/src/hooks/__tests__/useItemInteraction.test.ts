import { renderHook } from '@testing-library/react';
import { useItemInteraction } from '../useItemInteraction';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234',
}));

// 외부 스토어 모킹
jest.mock('@/store/useWhiteboardLocalStore');

// 타입 안전을 위한 모킹 함수 캐스팅
const mockedLocalStore = useWhiteboardLocalStore as unknown as jest.Mock;

describe('useItemInteraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupStore = (cursorMode: string) => {
    mockedLocalStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({ cursorMode }),
    );
  };

  it('[Select 모드 확인] cursorMode가 select일 때 모든 상호작용이 활성화되는가', () => {
    setupStore('select');
    const { result } = renderHook(() => useItemInteraction());

    expect(result.current.isInteractive).toBe(true);
    expect(result.current.isDraggable).toBe(true);
    expect(result.current.isListening).toBe(true);
  });

  it('[Eraser 모드 확인] eraser 모드에서는 드래그는 안 되지만 이벤트 리스닝은 되는가', () => {
    setupStore('eraser');
    const { result } = renderHook(() => useItemInteraction());

    expect(result.current.isInteractive).toBe(false);
    expect(result.current.isDraggable).toBe(false);
    expect(result.current.isListening).toBe(true);
  });

  it('[Move 모드 확인] move 모드에서는 모든 상호작용이 비활성화되는가', () => {
    setupStore('move');
    const { result } = renderHook(() => useItemInteraction());

    expect(result.current.isInteractive).toBe(false);
    expect(result.current.isDraggable).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it('[기타 모드 확인] pen 모드 등 정의되지 않은 모드에서 상호작용이 차단되는가', () => {
    setupStore('pen');
    const { result } = renderHook(() => useItemInteraction());

    expect(result.current.isInteractive).toBe(false);
    expect(result.current.isListening).toBe(false);
  });
});
