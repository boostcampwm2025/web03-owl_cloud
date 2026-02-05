'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Transformer } from 'react-konva';
import type { WhiteboardItem } from '@/types/whiteboard';

interface RemoteSelectionIndicatorProps {
  selectedId: string;
  userColor: string;
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function RemoteSelectionIndicator({
  selectedId,
  userColor,
  items,
  stageRef,
}: RemoteSelectionIndicatorProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // Transformer 연결
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;

      if (selectedId) {
        const selectedNode = stage.findOne('#' + selectedId);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
        } else {
          transformerRef.current.nodes([]);
        }
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId, items, stageRef]);

  return (
    <Transformer
      ref={transformerRef}
      enabledAnchors={[]}
      rotateEnabled={false}
      borderStroke={userColor}
      borderStrokeWidth={3}
      opacity={0.6}
      padding={8}
    />
  );
}
