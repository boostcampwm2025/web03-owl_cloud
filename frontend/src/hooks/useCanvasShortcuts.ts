import { useEffect, useRef } from 'react';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { useWhiteboardHistory } from '@/hooks/useWhiteboardHistory';
import { useWhiteboardClipboard } from '@/hooks/useWhiteboardClipboard';
import { CursorMode } from '@/types/whiteboard/base';

interface UseCanvasShortcutsProps {
  isArrowOrLineSelected: boolean;
  selectedHandleIndex: number | null;
  deleteControlPoint: () => boolean;
}

export const useCanvasShortcuts = ({
  isArrowOrLineSelected,
  selectedHandleIndex,
  deleteControlPoint,
}: UseCanvasShortcutsProps) => {
  const selectedIds = useWhiteboardLocalStore((state) => state.selectedIds);
  const selectedId = selectedIds[0] ?? null;
  const editingTextId = useWhiteboardLocalStore((state) => state.editingTextId);
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const setCursorMode = useWhiteboardLocalStore((state) => state.setCursorMode);
  const clearSelection = useWhiteboardLocalStore(
    (state) => state.clearSelection,
  );
  const { deleteItem, deleteItems } = useItemActions();
  const { undo, redo } = useWhiteboardHistory();
  const { copy, paste } = useWhiteboardClipboard();

  const previousModeRef = useRef<CursorMode | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // 입력창이나 수정 가능한 영역에서는 단축키 동작 방지
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // 복사 단축키 (Ctrl+C)
      if (isMod && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copy();
        return;
      }

      // 붙여넣기 단축키 (Ctrl+V)
      if (isMod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        paste();
        return;
      }

      // Select (v)
      if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setCursorMode('select');
        return;
      }

      // move (h)
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setCursorMode('move');
        return;
      }

      // 일시 move (스페이스바)
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (previousModeRef.current === null) {
          previousModeRef.current = cursorMode;
          setCursorMode('move');
        }
        return;
      }

      // Redo 단축키 (Ctrl+Shift+Z 또는 Ctrl+Y)
      if (
        isMod &&
        ((e.shiftKey && e.key.toLowerCase() === 'z') ||
          e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Undo 단축키 (Ctrl+Z)
      if (isMod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if (selectedIds.length === 0 || editingTextId) return;

      // 삭제 단축기 (Delete / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();

        if (
          selectedIds.length === 1 &&
          isArrowOrLineSelected &&
          selectedHandleIndex !== null
        ) {
          const deleted = deleteControlPoint();
          if (deleted) return;
        }

        if (selectedIds.length === 1 && selectedId) {
          deleteItem(selectedId);
        } else {
          deleteItems(selectedIds);
        }
        clearSelection();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && previousModeRef.current !== null) {
        e.preventDefault();
        setCursorMode(previousModeRef.current);
        previousModeRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    selectedId,
    selectedIds,
    editingTextId,
    cursorMode,
    setCursorMode,
    deleteItem,
    deleteItems,
    isArrowOrLineSelected,
    selectedHandleIndex,
    deleteControlPoint,
    clearSelection,
    undo,
    redo,
    copy,
    paste,
  ]);
};
