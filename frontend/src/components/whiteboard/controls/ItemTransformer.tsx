'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Transformer } from 'react-konva';
import type { WhiteboardItem } from '@/types/whiteboard';

interface ItemTransformerProps {
  selectedId: string | null;
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function ItemTransformer({
  selectedId,
  items,
  stageRef,
}: ItemTransformerProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const selectedItem = items.find((item) => item.id === selectedId);
  const isTextSelected = selectedItem?.type === 'text';
  const isArrowSelected = selectedItem?.type === 'arrow';
  const isDrawingSelected = selectedItem?.type === 'drawing';

  // Transformer 연결
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;
      // 선택된 요소가 arrow 라면 Transformer 연결 안함(arrow는 자체 핸들 사용)
      if (selectedId && !isArrowSelected) {
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
  }, [selectedId, items, stageRef, isArrowSelected]);

  return (
    <Transformer
      ref={transformerRef}
      enabledAnchors={
        isTextSelected
          ? ['middle-left', 'middle-right']
          : [
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'top-center',
              'bottom-center',
              'middle-left',
              'middle-right',
            ]
      }
      rotateEnabled={!isDrawingSelected}
      anchorSize={10}
      anchorCornerRadius={5}
      anchorStrokeWidth={1.5}
      anchorStroke="#0369A1"
      anchorFill="#ffffff"
      borderStroke="#0369A1"
      borderStrokeWidth={1.5}
      rotationSnaps={[0, 90, 180, 270]}
      rotationSnapTolerance={10}
      keepRatio={false}
      boundBoxFunc={(oldBox, newBox) => {
        // 최소 크기 제한
        const stage = stageRef.current;
        const stageScale = stage ? stage.scaleX() : 1;

        // 화면 확대 시 최소 크기도 함께 증가시켜야 더 못줄임
        const minWidth = 30 * stageScale;
        const minHeight = 30 * stageScale;

        // 너비가 최소값보다 작으면 제한하고 위치 보정
        if (newBox.width < minWidth) {
          if (newBox.x !== oldBox.x) {
            newBox.x = oldBox.x + oldBox.width - minWidth;
          }
          newBox.width = minWidth;
        }

        // 높이가 최소값보다 작으면 제한하고 위치 보정
        if (newBox.height < minHeight) {
          if (newBox.y !== oldBox.y) {
            newBox.y = oldBox.y + oldBox.height - minHeight;
          }
          newBox.height = minHeight;
        }

        return newBox;
      }}
    />
  );
}
