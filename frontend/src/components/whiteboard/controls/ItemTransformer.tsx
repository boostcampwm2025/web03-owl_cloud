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
  const isArrowOrLineSelected =
    selectedItem?.type === 'arrow' || selectedItem?.type === 'line';
  const isDrawingSelected = selectedItem?.type === 'drawing';

  // Transformer 연결
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;

      if (selectedId && !isArrowOrLineSelected) {
        // 해당 ID 노드 확인
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
  }, [selectedId, items, stageRef, isArrowOrLineSelected]);

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

        // 기본 최소 크기
        const minWidth = 30 * stageScale;
        let minHeight = 30 * stageScale;

        // 도형에 텍스트가 있으면 텍스트 높이 고려
        if (selectedItem?.type === 'shape' && selectedItem.text && stage) {
          const shapeNode = stage.findOne('#' + selectedId) as Konva.Group;
          if (shapeNode) {
            const textNode = shapeNode.findOne('Text') as Konva.Text;
            if (textNode) {
              // 새로운 너비로 텍스트 노드 너비 임시 설정
              const originalWidth = textNode.width();
              const originalHeight = textNode.height();
              const newTextWidth = (newBox.width / stageScale) * 0.8;

              textNode.width(newTextWidth);
              // @ts-expect-error 라이브러리 타입 정의에는 없지만 실제로 'auto' 값을 허용함
              textNode.height('auto');

              // 텍스트 실제 높이 계산
              const requiredTextHeight = textNode.height() + 8;

              // 원래 크기로 복원
              textNode.width(originalWidth);
              textNode.height(originalHeight);

              // 좌우 앵커 드래그 감지
              const activeAnchor = transformerRef.current?.getActiveAnchor();
              const isHorizontalResize =
                activeAnchor === 'middle-left' ||
                activeAnchor === 'middle-right';

              if (isHorizontalResize) {
                // 원래 높이와 텍스트 필요 높이 중 큰 값으로 자동 조절
                const shapeItem = selectedItem as { height: number };
                const originalShapeHeight = shapeItem.height * stageScale;
                const targetHeight = Math.max(
                  originalShapeHeight,
                  requiredTextHeight * stageScale,
                );

                if (Math.abs(newBox.height - targetHeight) > 1) {
                  const heightDiff = targetHeight - newBox.height;
                  newBox.height = targetHeight;

                  // y 위치 보정 (위쪽 앵커 드래그 시)
                  if (newBox.y !== oldBox.y) {
                    newBox.y = oldBox.y - heightDiff;
                  }
                }
              }

              // 텍스트 표시 위한 최소 높이
              minHeight = Math.max(minHeight, requiredTextHeight * stageScale);
            }
          }
        }

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
