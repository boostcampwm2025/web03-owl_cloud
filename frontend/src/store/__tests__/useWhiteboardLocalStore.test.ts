import { renderHook, act } from '@testing-library/react';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('useWhiteboardLocalStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useWhiteboardLocalStore());
    act(() => {
      result.current.clearSelection();
      result.current.setEditingTextId(null);
      result.current.setCursorMode('select');
      result.current.setDrawingSize('M');
      result.current.finishDrawing();
    });
  });

  describe('선택 관리', () => {
    it('selectOnly: 단일 아이템 선택', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectOnly('item-1');
      });

      expect(result.current.selectedIds).toEqual(['item-1']);
    });

    it('selectOnly: 기존 선택을 덮어씀', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectMultiple(['item-1', 'item-2']);
        result.current.selectOnly('item-3');
      });

      expect(result.current.selectedIds).toEqual(['item-3']);
    });

    it('selectMultiple: 여러 아이템 선택', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectMultiple(['item-1', 'item-2', 'item-3']);
      });

      expect(result.current.selectedIds).toEqual([
        'item-1',
        'item-2',
        'item-3',
      ]);
    });

    it('toggleSelection: 선택되지 않은 아이템 추가', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectOnly('item-1');
        result.current.toggleSelection('item-2');
      });

      expect(result.current.selectedIds).toEqual(['item-1', 'item-2']);
    });

    it('toggleSelection: 이미 선택된 아이템 제거', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectMultiple(['item-1', 'item-2']);
        result.current.toggleSelection('item-1');
      });

      expect(result.current.selectedIds).toEqual(['item-2']);
    });

    it('addToSelection: 선택에 아이템 추가', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectOnly('item-1');
        result.current.addToSelection('item-2');
      });

      expect(result.current.selectedIds).toEqual(['item-1', 'item-2']);
    });

    it('addToSelection: 이미 선택된 아이템은 무시', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectOnly('item-1');
        result.current.addToSelection('item-1');
      });

      expect(result.current.selectedIds).toEqual(['item-1']);
    });

    it('removeFromSelection: 선택에서 아이템 제거', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectMultiple(['item-1', 'item-2', 'item-3']);
        result.current.removeFromSelection('item-2');
      });

      expect(result.current.selectedIds).toEqual(['item-1', 'item-3']);
    });

    it('clearSelection: 모든 선택 해제', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.selectMultiple(['item-1', 'item-2']);
        result.current.clearSelection();
      });

      expect(result.current.selectedIds).toEqual([]);
    });
  });

  describe('Awareness 콜백', () => {
    it('selectOnly 시 콜백 호출', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());
      const mockCallback = jest.fn();

      act(() => {
        result.current.setAwarenessCallback(mockCallback);
        result.current.selectOnly('item-1');
      });

      expect(mockCallback).toHaveBeenCalledWith(['item-1']);
    });

    it('selectMultiple 시 콜백 호출', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());
      const mockCallback = jest.fn();

      act(() => {
        result.current.setAwarenessCallback(mockCallback);
        result.current.selectMultiple(['item-1', 'item-2']);
      });

      expect(mockCallback).toHaveBeenCalledWith(['item-1', 'item-2']);
    });

    it('toggleSelection 시 콜백 호출', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());
      const mockCallback = jest.fn();

      act(() => {
        result.current.setAwarenessCallback(mockCallback);
        result.current.toggleSelection('item-1');
      });

      expect(mockCallback).toHaveBeenCalledWith(['item-1']);
    });

    it('clearSelection 시 콜백 호출', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());
      const mockCallback = jest.fn();

      act(() => {
        result.current.setAwarenessCallback(mockCallback);
        result.current.selectOnly('item-1');
        mockCallback.mockClear();
        result.current.clearSelection();
      });

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('콜백이 없으면 에러 없이 동작', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      expect(() => {
        act(() => {
          result.current.selectOnly('item-1');
        });
      }).not.toThrow();
    });
  });

  describe('텍스트 편집', () => {
    it('setEditingTextId: 편집 중인 텍스트 ID 설정', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setEditingTextId('text-1');
      });

      expect(result.current.editingTextId).toBe('text-1');
    });

    it('setEditingTextId: null로 편집 종료', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setEditingTextId('text-1');
        result.current.setEditingTextId(null);
      });

      expect(result.current.editingTextId).toBeNull();
    });
  });

  describe('커서 모드', () => {
    it('setCursorMode: 커서 모드 변경', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setCursorMode('draw');
      });

      expect(result.current.cursorMode).toBe('draw');
    });

    it('초기 커서 모드는 select', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      expect(result.current.cursorMode).toBe('select');
    });
  });

  describe('Stage 상태', () => {
    it('setStageScale: 줌 레벨 설정', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setStageScale(1.5);
      });

      expect(result.current.stageScale).toBe(1.5);
    });

    it('setStagePos: Stage 위치 설정', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setStagePos({ x: 100, y: 200 });
      });

      expect(result.current.stagePos).toEqual({ x: 100, y: 200 });
    });

    it('setViewportSize: 뷰포트 크기 설정', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setViewportSize(1920, 1080);
      });

      expect(result.current.viewportWidth).toBe(1920);
      expect(result.current.viewportHeight).toBe(1080);
    });
  });

  describe('그리기 상태', () => {
    it('setDrawingStroke: 그리기 색상 설정', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setDrawingStroke('#ff0000');
      });

      expect(result.current.drawingStroke).toBe('#ff0000');
    });

    it('setDrawingSize: 그리기 크기 설정', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setDrawingSize('L');
      });

      expect(result.current.drawingSize).toBe('L');
    });

    it('startDrawing: 그리기 시작', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.startDrawing(100, 200);
      });

      expect(result.current.currentDrawing).not.toBeNull();
      expect(result.current.currentDrawing?.points).toEqual([100, 200]);
      expect(result.current.currentDrawing?.type).toBe('drawing');
    });

    it('continueDrawing: 포인트 추가', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.startDrawing(100, 200);
        result.current.continueDrawing(150, 250);
      });

      expect(result.current.currentDrawing?.points).toEqual([
        100, 200, 150, 250,
      ]);
    });

    it('continueDrawing: 그리기 중이 아니면 무시', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.continueDrawing(150, 250);
      });

      expect(result.current.currentDrawing).toBeNull();
    });

    it('finishDrawing: 그리기 종료', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.startDrawing(100, 200);
        result.current.finishDrawing();
      });

      expect(result.current.currentDrawing).toBeNull();
    });

    it('그리기 시 현재 stroke와 size 사용', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());

      act(() => {
        result.current.setDrawingStroke('#00ff00');
        result.current.setDrawingSize('L');
      });

      act(() => {
        result.current.startDrawing(100, 200);
      });

      expect(result.current.currentDrawing?.stroke).toBe('#00ff00');
      expect(result.current.currentDrawing?.strokeWidth).toBe(20);
    });
  });

  describe('커서 콜백', () => {
    it('setCursorCallback: 커서 콜백 설정', () => {
      const { result } = renderHook(() => useWhiteboardLocalStore());
      const mockCallback = jest.fn();

      act(() => {
        result.current.setCursorCallback(mockCallback);
      });

      expect(result.current.cursorCallback).toBe(mockCallback);
    });
  });
});
