import { useEffect } from 'react';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { useWhiteboardHistory } from '@/hooks/useWhiteboardHistory';

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
  const { deleteItem } = useItemActions();
  const { undo, redo } = useWhiteboardHistory();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedId,
    editingTextId,
    deleteItem,
    isArrowOrLineSelected,
    selectedHandleIndex,
    deleteControlPoint,
    undo,
    redo,
  ]);
};
