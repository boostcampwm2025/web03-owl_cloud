'use client';

import { useState, useEffect } from 'react';
import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import RemoteCursor from './RemoteCursor';

export default function RemoteCursors() {
  const users = useWhiteboardAwarenessStore((state) => state.users);
  const myUserId = useWhiteboardAwarenessStore((state) => state.myUserId);
  const stageRef = useWhiteboardLocalStore((state) => state.stageRef);

  const [stageTransform, setStageTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });

  useEffect(() => {
    const stage = stageRef?.current;
    if (!stage) return;

    const updateTransform = () => {
      const pos = stage.position();
      const scale = stage.scaleX();
      setStageTransform({ x: pos.x, y: pos.y, scale });
    };

    // 초기값 설정
    updateTransform();

    // Stage 이동/줌 시 업데이트
    stage.on('dragmove', updateTransform);
    stage.on('dragend', updateTransform);
    stage.on('wheel', updateTransform);

    return () => {
      stage.off('dragmove', updateTransform);
      stage.off('dragend', updateTransform);
      stage.off('wheel', updateTransform);
    };
  }, [stageRef]);

  return (
    <>
      {Array.from(users.values()).map((user) => {
        if (user.id === myUserId || !user.cursor) return null;

        // Canvas 좌표를 화면 좌표로 변환
        const screenX = user.cursor.x * stageTransform.scale + stageTransform.x;
        const screenY = user.cursor.y * stageTransform.scale + stageTransform.y;

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
