'use client';

import React, { useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export default function WorkspaceStage() {
  const { cardData, zoom } = useWorkspaceStore();
  const stageRef = useRef<any>(null);

  return (
    <div className="bg-white">
      <Stage
        width={cardData.workspaceWidth * zoom}
        height={cardData.workspaceHeight * zoom}
        scaleX={zoom}
        scaleY={zoom}
        ref={stageRef}
        className="bg-white"
      >
        <Layer>
          {/* 배경색 (캔버스 영역) */}
          <Rect
            x={0}
            y={0}
            width={cardData.workspaceWidth}
            height={cardData.workspaceHeight}
            fill={cardData.backgroundColor}
            shadowBlur={10}
          />
          {/* TODO: <RenderItem />과 <Transformer />가 들어갈 예정 */}
        </Layer>
      </Stage>
    </div>
  );
}
