'use client';

import Konva from 'konva';
import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import RemoteSelectionIndicator from './RemoteSelectionIndicator';
import type { WhiteboardItem } from '@/types/whiteboard';

interface RemoteSelectionLayerProps {
  myUserId: string;
  selectedId: string | null;
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function RemoteSelectionLayer({
  myUserId,
  selectedId,
  items,
  stageRef,
}: RemoteSelectionLayerProps) {
  const users = useWhiteboardAwarenessStore((state) => state.users);

  const mySelectedIds = useWhiteboardLocalStore((state) => state.selectedIds);
  const mySelectedSet = new Set(mySelectedIds);

  const displayedItemIds = new Set<string>();

  return (
    <>
      {Array.from(users.values()).flatMap((user) => {
        if (user.id === myUserId) return [];

        if (!user.selectedIds || user.selectedIds.length === 0) return [];

        return user.selectedIds
          .filter((itemId) => {
            if (mySelectedSet.has(itemId)) return false;

            if (displayedItemIds.has(itemId)) return false;

            displayedItemIds.add(itemId);
            return true;
          })
          .map((itemId) => (
            <RemoteSelectionIndicator
              key={`${user.id}-${itemId}`}
              selectedId={itemId}
              userColor={user.color}
              items={items}
              stageRef={stageRef}
            />
          ));
      })}
    </>
  );
}
