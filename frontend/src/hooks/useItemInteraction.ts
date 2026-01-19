import { useCanvasStore } from '@/store/useCanvasStore';

export function useItemInteraction() {
  const cursorMode = useCanvasStore((state) => state.cursorMode);

  return {
    // 아이템 조작 가능 여부
    isInteractive: cursorMode === 'select',

    // 아이템 드래그 가능 여부
    isDraggable: cursorMode === 'select',

    // 이벤트 리스닝 여부
    isListening: cursorMode === 'select' || cursorMode === 'eraser',
  };
}
