import { useRef, useCallback } from 'react';
import type { WhiteboardItem } from '@/types/whiteboard';
import { useItemActions } from '@/hooks/useItemActions';

interface UseMultiDragProps {
  selectedIds: string[];
  items: WhiteboardItem[];
}

export function useMultiDrag({ selectedIds, items }: UseMultiDragProps) {
  const { updateItem, performTransaction } = useItemActions();

  const multiDragStartPosRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const multiDragDeltaRef = useRef<{ dx: number; dy: number } | null>(null);

  const startMultiDrag = useCallback(
    (draggedItemId: string) => {
      if (selectedIds.length <= 1 || !selectedIds.includes(draggedItemId)) {
        return;
      }

      const itemsMap = new Map(items.map((item) => [item.id, item]));
      const newStartPos = new Map<string, { x: number; y: number }>();

      selectedIds.forEach((id) => {
        const targetItem = itemsMap.get(id);
        if (!targetItem) return;

        if ('x' in targetItem && 'y' in targetItem) {
          newStartPos.set(id, {
            x: targetItem.x,
            y: targetItem.y,
          });
        } else if (
          targetItem.type === 'arrow' ||
          targetItem.type === 'line' ||
          targetItem.type === 'drawing'
        ) {
          newStartPos.set(id, { x: 0, y: 0 });
        }
      });

      multiDragStartPosRef.current = newStartPos;
      multiDragDeltaRef.current = null;
    },
    [selectedIds, items],
  );

  // 드래그 중 - delta 계산
  const updateMultiDrag = useCallback(
    (draggedItemId: string, x: number, y: number) => {
      if (selectedIds.length <= 1 || !selectedIds.includes(draggedItemId)) {
        return false;
      }

      const startPos = multiDragStartPosRef.current.get(draggedItemId);
      if (startPos) {
        const dx = x - startPos.x;
        const dy = y - startPos.y;
        multiDragDeltaRef.current = { dx, dy };
        return true;
      }
      return false;
    },
    [selectedIds],
  );

  const finishMultiDrag = useCallback(() => {
    const delta = multiDragDeltaRef.current;
    if (!delta || selectedIds.length <= 1) {
      return;
    }

    const { dx, dy } = delta;
    const itemsMap = new Map(items.map((item) => [item.id, item]));

    performTransaction(() => {
      selectedIds.forEach((itemId) => {
        const item = itemsMap.get(itemId);
        if (!item) return;

        if (
          item.type === 'arrow' ||
          item.type === 'line' ||
          item.type === 'drawing'
        ) {
          const newPoints = item.points.map((p, i) =>
            i % 2 === 0 ? p + dx : p + dy,
          );

          if (item.type === 'arrow') {
            const updates: Partial<typeof item> = { points: newPoints };

            if (
              item.startBinding?.elementId &&
              !selectedIds.includes(item.startBinding.elementId)
            ) {
              updates.startBinding = null;
            }
            if (
              item.endBinding?.elementId &&
              !selectedIds.includes(item.endBinding.elementId)
            ) {
              updates.endBinding = null;
            }

            updateItem(itemId, updates);
          } else {
            updateItem(itemId, { points: newPoints });
          }
          return;
        }

        if ('x' in item && 'y' in item) {
          updateItem(itemId, {
            x: item.x + dx,
            y: item.y + dy,
          });
        }
      });
    });

    multiDragStartPosRef.current = new Map();
    multiDragDeltaRef.current = null;
  }, [selectedIds, items, updateItem, performTransaction]);

  // 멀티 드래그 중인지 확인
  const isMultiDragging = useCallback(
    (itemId: string) => {
      return (
        multiDragDeltaRef.current !== null &&
        selectedIds.length > 1 &&
        selectedIds.includes(itemId)
      );
    },
    [selectedIds],
  );

  // 아이템의 드래그 중 위치 계산
  const getMultiDragPosition = useCallback(
    (itemId: string) => {
      const delta = multiDragDeltaRef.current;
      if (!delta || !selectedIds.includes(itemId)) {
        return null;
      }

      const startPos = multiDragStartPosRef.current.get(itemId);
      if (!startPos) return null;

      return {
        x: startPos.x + delta.dx,
        y: startPos.y + delta.dy,
      };
    },
    [selectedIds],
  );

  return {
    startMultiDrag,
    updateMultiDrag,
    finishMultiDrag,
    isMultiDragging,
    getMultiDragPosition,
  };
}
