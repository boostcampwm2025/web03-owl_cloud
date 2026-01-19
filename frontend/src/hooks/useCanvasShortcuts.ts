import { useEffect } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';

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
  const selectedId = useCanvasStore((state) => state.selectedId);
  const editingTextId = useCanvasStore((state) => state.editingTextId);
  const deleteItem = useCanvasStore((state) => state.deleteItem);

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
