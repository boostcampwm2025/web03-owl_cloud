import { renderHook, act } from '@testing-library/react';
import { useWhiteboardHistory } from '../useWhiteboardHistory';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234',
}));

// 외부 스토어 모킹
jest.mock('@/store/useWhiteboardSharedStore');

const mockedSharedStore = useWhiteboardSharedStore as unknown as jest.Mock;

describe('useWhiteboardHistory', () => {
  // 모킹된 UndoManager 객체 정의
  const mockUndoManager = {
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: jest.fn(),
    canRedo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedSharedStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          undoManager: mockUndoManager,
        }),
    );
  });

  it('[Undo 실행 확인] canUndo가 true일 때 undo 함수를 호출하면 undoManager.undo가 실행되는가', () => {
    mockUndoManager.canUndo.mockReturnValue(true);
    const { result } = renderHook(() => useWhiteboardHistory());

    act(() => {
      result.current.undo();
    });

    // undoManager의 undo 메서드가 실제로 호출되었는지 확인
    expect(mockUndoManager.undo).toHaveBeenCalledTimes(1);
  });

  it('[Undo 차단 확인] canUndo가 false일 때 undo 함수를 호출해도 undoManager.undo가 실행되지 않는가', () => {
    mockUndoManager.canUndo.mockReturnValue(false);
    const { result } = renderHook(() => useWhiteboardHistory());

    act(() => {
      result.current.undo();
    });

    // 호출되지 않아야 함 확인
    expect(mockUndoManager.undo).not.toHaveBeenCalled();
  });

  it('[Redo 실행 확인] canRedo가 true일 때 redo 함수를 호출하면 undoManager.redo가 실행되는가', () => {
    mockUndoManager.canRedo.mockReturnValue(true);
    const { result } = renderHook(() => useWhiteboardHistory());

    act(() => {
      result.current.redo();
    });

    // redoManager의 redo 메서드가 실제로 호출되었는지 확인
    expect(mockUndoManager.redo).toHaveBeenCalledTimes(1);
  });

  it('[Redo 차단 확인] canRedo가 false일 때 redo 함수를 호출해도 undoManager.redo가 실행되지 않는가', () => {
    mockUndoManager.canRedo.mockReturnValue(false);
    const { result } = renderHook(() => useWhiteboardHistory());

    act(() => {
      result.current.redo();
    });

    // 호출되지 않아야 함 확인
    expect(mockUndoManager.redo).not.toHaveBeenCalled();
  });

  it('[스토어 연결 확인] undoManager가 존재하지 않을 때 호출해도 에러가 발생하지 않는가', () => {
    mockedSharedStore.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          undoManager: null,
        }),
    );

    const { result } = renderHook(() => useWhiteboardHistory());

    // 에러 없이 종료되는지 확인
    expect(() => {
      act(() => {
        result.current.undo();
        result.current.redo();
      });
    }).not.toThrow();
  });
});
