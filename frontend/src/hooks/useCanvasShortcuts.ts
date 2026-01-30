import { useEffect, useRef } from 'react';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { useWhiteboardHistory } from '@/hooks/useWhiteboardHistory';
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
  const selectedId = useWhiteboardLocalStore((state) => state.selectedId);
  const editingTextId = useWhiteboardLocalStore((state) => state.editingTextId);
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const setCursorMode = useWhiteboardLocalStore((state) => state.setCursorMode);
  const { deleteItem } = useItemActions();
  const { undo, redo } = useWhiteboardHistory();

  const previousModeRef = useRef<CursorMode | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
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
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && e.key.toLowerCase() === 'z') ||
          e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Undo 단축키 (Ctrl+Z)
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        e.key.toLowerCase() === 'z'
      ) {
        e.preventDefault();
        undo();
        return;
      }

      if (!selectedId || editingTextId) return;

      // 삭제 단축기 (Delete / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();

        if (isArrowOrLineSelected && selectedHandleIndex !== null) {
          const deleted = deleteControlPoint();
          if (deleted) return;
        }

        deleteItem(selectedId);
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
    editingTextId,
    cursorMode,
    setCursorMode,
    deleteItem,
    isArrowOrLineSelected,
    selectedHandleIndex,
    deleteControlPoint,
    undo,
    redo,
  ]);
};
