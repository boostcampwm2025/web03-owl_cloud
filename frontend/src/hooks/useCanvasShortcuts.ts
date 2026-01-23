import { useEffect } from 'react';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || editingTextId) return;

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
  ]);
};
