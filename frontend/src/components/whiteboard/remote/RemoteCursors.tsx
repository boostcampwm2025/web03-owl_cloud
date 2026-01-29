'use client';

import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import RemoteCursor from './RemoteCursor';

export default function RemoteCursors() {
  const users = useWhiteboardAwarenessStore((state) => state.users);
  const myUserId = useWhiteboardAwarenessStore((state) => state.myUserId);
  const stagePos = useWhiteboardLocalStore((state) => state.stagePos);
  const stageScale = useWhiteboardLocalStore((state) => state.stageScale);

  return (
    <>
      {Array.from(users.values()).map((user) => {
        if (user.id === myUserId || !user.cursor) return null;

        // Canvas 좌표를 화면 좌표로 변환
        const screenX = user.cursor.x * stageScale + stagePos.x;
        const screenY = user.cursor.y * stageScale + stagePos.y;

        return (
          <RemoteCursor
            key={user.id}
            x={screenX}
            y={screenY}
            color={user.color}
            name={user.name}
          />
        );
      })}
    </>
  );
}
