import { renderHook } from '@testing-library/react';
import { useCanvasShortcuts } from '../useCanvasShortcuts';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { useWhiteboardHistory } from '@/hooks/useWhiteboardHistory';
import { useWhiteboardClipboard } from '@/hooks/useWhiteboardClipboard';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234',
}));

// 외부 의존성 모킹
jest.mock('@/store/useWhiteboardLocalStore');
jest.mock('@/hooks/useItemActions');
jest.mock('@/hooks/useWhiteboardHistory');
jest.mock('@/hooks/useWhiteboardClipboard');

// 타입 안전을 위한 모킹 함수 캐스팅
const mockedLocalStore = useWhiteboardLocalStore as unknown as jest.Mock;
const mockedUseItemActions = useItemActions as jest.MockedFunction<
  typeof useItemActions
>;
const mockedUseWhiteboardHistory = useWhiteboardHistory as jest.MockedFunction<
  typeof useWhiteboardHistory
>;
const mockedUseWhiteboardClipboard =
  useWhiteboardClipboard as jest.MockedFunction<typeof useWhiteboardClipboard>;

describe('useCanvasShortcuts', () => {
  const mockSetCursorMode = jest.fn();
  const mockClearSelection = jest.fn();
  const mockDeleteItem = jest.fn();
  const mockDeleteItems = jest.fn();
  const mockUndo = jest.fn();
  const mockRedo = jest.fn();
  const mockCopy = jest.fn();
  const mockPaste = jest.fn();
  const mockDeleteControlPoint = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedLocalStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          selectedIds: [],
          editingTextId: null,
          cursorMode: 'select',
          setCursorMode: mockSetCursorMode,
          clearSelection: mockClearSelection,
        }),
    );

    mockedUseItemActions.mockReturnValue({
      deleteItem: mockDeleteItem,
      deleteItems: mockDeleteItems,
    } as unknown as ReturnType<typeof useItemActions>);

    mockedUseWhiteboardHistory.mockReturnValue({
      undo: mockUndo,
      redo: mockRedo,
    } as unknown as ReturnType<typeof useWhiteboardHistory>);

    mockedUseWhiteboardClipboard.mockReturnValue({
      copy: mockCopy,
      paste: mockPaste,
    } as unknown as ReturnType<typeof useWhiteboardClipboard>);
  });

  const setup = (props = {}) => {
    const defaultProps = {
      isArrowOrLineSelected: false,
      selectedHandleIndex: null,
      deleteControlPoint: mockDeleteControlPoint,
    };
    return renderHook(() => useCanvasShortcuts({ ...defaultProps, ...props }));
  };

  it('[복사/붙여넣기 확인] Ctrl+C와 Ctrl+V 입력 시 copy와 paste 함수가 실행되는가', () => {
    setup();

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }),
    );
    expect(mockCopy).toHaveBeenCalled();

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'v', ctrlKey: true }),
    );
    expect(mockPaste).toHaveBeenCalled();
  });

  it('[도구 전환 확인] v키와 h키 입력 시 커서 모드가 올바르게 변경되는가', () => {
    setup();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
    expect(mockSetCursorMode).toHaveBeenCalledWith('select');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(mockSetCursorMode).toHaveBeenCalledWith('move');
  });

  it('[Undo/Redo 확인] Ctrl+Z 및 Ctrl+Y 입력 시 실행되는가', () => {
    setup();

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }),
    );
    expect(mockUndo).toHaveBeenCalled();

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }),
    );
    expect(mockRedo).toHaveBeenCalled();
  });

  it('[삭제 단축키 확인] 아이템 선택 중 Delete키 입력 시 deleteItem이 호출되는가', () => {
    mockedLocalStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          selectedIds: ['item-1'],
          editingTextId: null,
          clearSelection: mockClearSelection,
        }),
    );

    setup();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

    expect(mockDeleteItem).toHaveBeenCalledWith('item-1');
    expect(mockClearSelection).toHaveBeenCalled();
  });

  it('[입력창 동작 방지 확인] input 태그 안에서 입력 시 단축키가 동작하지 않아야 한다', () => {
    setup();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'v', bubbles: true });
    input.dispatchEvent(event);

    expect(mockSetCursorMode).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('[일시 이동 모드 확인] Space 키를 누르고 있을 때 move 모드로 변경되고 떼면 복구되는가', () => {
    mockedLocalStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          selectedIds: [],
          cursorMode: 'select',
          setCursorMode: mockSetCursorMode,
        }),
    );

    setup();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(mockSetCursorMode).toHaveBeenCalledWith('move');

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    expect(mockSetCursorMode).toHaveBeenCalledWith('select');
  });
});
