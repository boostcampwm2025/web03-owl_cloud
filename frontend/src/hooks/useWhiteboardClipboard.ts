import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';
import { useState, useCallback } from 'react';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';

import { useItemActions } from '@/hooks/useItemActions';

import type { WhiteboardItem } from '@/types/whiteboard';
import type { YMapValue } from '@/types/whiteboard/yjs';

export const useWhiteboardClipboard = () => {
  const [clipboard, setClipboard] = useState<WhiteboardItem[]>([]);

  const selectedIds = useWhiteboardLocalStore((state) => state.selectedIds);
  const selectMultiple = useWhiteboardLocalStore(
    (state) => state.selectMultiple,
  );
  const items = useWhiteboardSharedStore((state) => state.items);
  const yItems = useWhiteboardSharedStore((state) => state.yItems);

  const { performTransaction } = useItemActions();

  // 복사 (Copy)
  const copy = useCallback(() => {
    if (selectedIds.length === 0) return;

    const targetItems = items.filter((item) => selectedIds.includes(item.id));
    if (targetItems.length > 0) {
      setClipboard(JSON.parse(JSON.stringify(targetItems)) as WhiteboardItem[]);
    }
  }, [selectedIds, items]);

  // 붙여넣기 (Paste)
  const paste = useCallback(() => {
    // 클립보드가 비어있거나 Yjs 연결이 유효하지 않으면 중단
    if (clipboard.length === 0 || !yItems || !yItems.doc) return;

    const newIds: string[] = [];

    performTransaction(() => {
      // 붙여넣기 시 기존 위치에서 오프셋된 위치에 삽입
      const offset = 30;
      // 복제본 고유 id 생성

      clipboard.forEach((clipboardItem) => {
        const newId = uuidv4();
        newIds.push(newId);

        // 속성 수정을 위해 임시 객체 생성
        const newItem = { ...clipboardItem } as Record<string, unknown>;
        newItem.id = newId;

        // 타입별 좌표 이동 처리
        if (newItem.type === 'drawing') {
          if (Array.isArray(newItem.points)) {
            newItem.points = newItem.points.map((p: number) => p + offset);
          }
        } else {
          if (typeof newItem.x === 'number') newItem.x += offset;
          if (typeof newItem.y === 'number') newItem.y += offset;

          if (Array.isArray(newItem.points)) {
            newItem.points = newItem.points.map((p: number) => p + offset);
          }
        }

        // Yjs 공유 데이터 구조 생성 및 데이터 주입
        const yMap = new Y.Map<YMapValue>();

        Object.entries(newItem).forEach(([key, value]) => {
          if (value !== undefined) yMap.set(key, value as YMapValue);
        });

        // 공유 배열 끝에 삽입 해서 다른 사용자에게 동기화
        yItems.push([yMap]);
      });
    });

    selectMultiple(newIds);
  }, [clipboard, yItems, performTransaction, selectMultiple]);

  return { copy, paste };
};
