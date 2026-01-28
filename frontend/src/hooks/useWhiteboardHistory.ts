import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';

export function useWhiteboardHistory() {
  const undoManager = useWhiteboardSharedStore((state) => state.undoManager);

  const undo = () => {
    if (!undoManager || !undoManager.canUndo()) return;
    undoManager.undo();
  };

  const redo = () => {
    if (!undoManager || !undoManager.canRedo()) return;
    undoManager.redo();
  };

  return {
    undo,
    redo,
  };
}
