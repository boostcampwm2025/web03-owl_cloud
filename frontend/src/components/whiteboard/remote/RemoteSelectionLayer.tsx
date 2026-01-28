'use client';

import Konva from 'konva';
import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
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

  const displayedItemIds = new Set<string>();

  return (
    <>
      {Array.from(users.values())
        .filter((user) => {
          if (
            user.id === myUserId ||
            !user.selectedId ||
            user.selectedId === selectedId
          ) {
            return false;
          }
          if (displayedItemIds.has(user.selectedId)) return false;
          displayedItemIds.add(user.selectedId);
          return true;
        })
        .map((user) => (
          <RemoteSelectionIndicator
            key={user.id}
            selectedId={user.selectedId!}
            userColor={user.color}
            items={items}
            stageRef={stageRef}
          />
        ))}
    </>
  );
}
