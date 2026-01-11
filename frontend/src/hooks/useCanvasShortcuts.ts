import { useEffect } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';

interface UseCanvasShortcutsProps {
  isArrowSelected: boolean;
  selectedHandleIndex: number | null;
  deleteControlPoint: () => boolean;
}

export const useCanvasShortcuts = ({
  isArrowSelected,
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

        if (isArrowSelected && selectedHandleIndex !== null) {
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
    isArrowSelected,
    selectedHandleIndex,
    deleteControlPoint,
  ]);
};
