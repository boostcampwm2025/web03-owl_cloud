'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import Konva from 'konva';
import { Transformer } from 'react-konva';
import type { WhiteboardItem } from '@/types/whiteboard';
import { useItemActions } from '@/hooks/useItemActions';

interface ItemTransformerProps {
  selectedIds: string[];
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function ItemTransformer({
  selectedIds,
  items,
  stageRef,
}: ItemTransformerProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const { updateItem, performTransaction } = useItemActions();

  const itemById = useMemo(() => {
    const map = new Map<string, WhiteboardItem>();
    items.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [items]);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const transformableItems =
    selectedItems.length === 1
      ? selectedItems.filter(
          (item) => item.type !== 'arrow' && item.type !== 'line',
        )
      : selectedItems;

  const isSingleSelection = transformableItems.length === 1;
  const selectedItem = isSingleSelection ? transformableItems[0] : null;
  const isTextSelected = selectedItem?.type === 'text';
  const isDrawingSelected = selectedItem?.type === 'drawing';
  const enabledAnchors = isSingleSelection
    ? isTextSelected
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
    : ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  // Transformer 연결
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;

      const selectedNodes = transformableItems
        .map((item) => stage.findOne('#' + item.id))
        .filter((node): node is Konva.Node => !!node);

      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [items, stageRef, transformableItems]);

  const handleTransformEnd = useCallback(() => {
    if (isSingleSelection) return;

    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    if (!nodes.length) return;

    performTransaction(() => {
      nodes.forEach((node) => {
        const id = node.id();
        if (!id) return;

        const item = itemById.get(id);
        if (!item) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation();
        const x = node.x();
        const y = node.y();

        if (item.type === 'shape') {
          const newWidth = Math.max(5, (item.width ?? 0) * scaleX);
          let newHeight = Math.max(5, (item.height ?? 0) * scaleY);

          // 텍스트가 있으면 텍스트 높이에 맞춰 조절
          if (item.text) {
            const groupNode = node as Konva.Group;
            const textNode = groupNode.findOne('Text') as Konva.Text;
            if (textNode) {
              const originalWidth = textNode.width();
              const originalHeight = textNode.height();
              const textWidth = newWidth * 0.8;

              textNode.width(textWidth);
              // @ts-expect-error 라이브러리 타입 정의에는 없지만 실제로 'auto' 값을 허용함
              textNode.height('auto');

              const requiredHeight = textNode.height() + 8;

              // 원래 크기로 복원
              textNode.width(originalWidth);
              textNode.height(originalHeight);

              // 텍스트를 모두 표시하기 위한 최소 높이
              newHeight = Math.max(newHeight, requiredHeight);

              // 텍스트 노드 스케일 리셋
              textNode.scaleX(1);
              textNode.scaleY(1);
            }
          }

          node.scaleX(1);
          node.scaleY(1);

          updateItem(id, {
            x,
            y,
            width: newWidth,
            height: newHeight,
            rotation,
          });
          return;
        }

        if (item.type === 'image' || item.type === 'stack') {
          const newWidth = Math.max(5, (item.width ?? 0) * scaleX);
          const newHeight = Math.max(5, (item.height ?? 0) * scaleY);

          node.scaleX(1);
          node.scaleY(1);

          updateItem(id, {
            x,
            y,
            width: newWidth,
            height: newHeight,
            rotation,
          });
          return;
        }

        if (item.type === 'text') {
          const textNode = node as Konva.Text;
          const newWidth = Math.max(5, textNode.width() * scaleX);
          const newFontSize = Math.max(8, textNode.fontSize());

          textNode.scaleX(1);
          textNode.scaleY(1);

          updateItem(id, {
            x,
            y,
            width: newWidth,
            fontSize: newFontSize,
            rotation,
          });
          return;
        }

        if (item.type === 'drawing') {
          const lineNode = node as Konva.Line;
          const currentPoints = lineNode.points();
          const scaledPoints = currentPoints.map((p, i) =>
            i % 2 === 0 ? p * scaleX : p * scaleY,
          );
          const pos = lineNode.position();
          const adjustedPoints = scaledPoints.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );

          lineNode.scaleX(1);
          lineNode.scaleY(1);
          lineNode.position({ x: 0, y: 0 });

          updateItem(id, {
            points: adjustedPoints,
            rotation,
          });
          return;
        }

        if (item.type === 'arrow') {
          const groupNode = node as Konva.Group;
          const currentPoints = item.points;
          const scaledPoints = currentPoints.map((p, i) =>
            i % 2 === 0 ? p * scaleX : p * scaleY,
          );
          const pos = groupNode.position();
          const adjustedPoints = scaledPoints.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );

          groupNode.scaleX(1);
          groupNode.scaleY(1);
          groupNode.position({ x: 0, y: 0 });

          updateItem(id, {
            points: adjustedPoints,
            rotation,
          });
          return;
        }

        if (item.type === 'line') {
          const lineNode = node as Konva.Line;
          const currentPoints = lineNode.points();
          const scaledPoints = currentPoints.map((p, i) =>
            i % 2 === 0 ? p * scaleX : p * scaleY,
          );
          const pos = lineNode.position();
          const adjustedPoints = scaledPoints.map((p, i) =>
            i % 2 === 0 ? p + pos.x : p + pos.y,
          );

          lineNode.scaleX(1);
          lineNode.scaleY(1);
          lineNode.position({ x: 0, y: 0 });

          updateItem(id, {
            points: adjustedPoints,
            rotation,
          });
        }
      });
    });
  }, [isSingleSelection, itemById, performTransaction, updateItem]);

  if (transformableItems.length === 0) return null;

  return (
    <Transformer
      ref={transformerRef}
      enabledAnchors={enabledAnchors}
      rotateEnabled={isSingleSelection ? !isDrawingSelected : false}
      anchorSize={10}
      anchorCornerRadius={5}
      anchorStrokeWidth={1.5}
      anchorStroke="#0369A1"
      anchorFill="#ffffff"
      borderStroke="#0369A1"
      borderStrokeWidth={1.5}
      rotationSnaps={[0, 90, 180, 270]}
      rotationSnapTolerance={10}
      keepRatio={!isSingleSelection}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        // 최소 크기 제한
        const stage = stageRef.current;
        const stageScale = stage ? stage.scaleX() : 1;

        // 기본 최소 크기
        const minWidth = 30 * stageScale;
        let minHeight = 30 * stageScale;

        // 도형에 텍스트가 있으면 텍스트 높이 고려
        if (
          isSingleSelection &&
          selectedItem?.type === 'shape' &&
          selectedItem.text &&
          stage
        ) {
          const shapeNode = stage.findOne('#' + selectedItem.id) as Konva.Group;
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
