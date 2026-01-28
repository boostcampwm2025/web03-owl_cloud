import { useState } from 'react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import type { ArrowItem, WhiteboardItem } from '@/types/whiteboard';
import { pointToSegmentDistance } from '@/utils/arrow';
import { getWorldPointerPosition } from '@/utils/coordinate';

interface UseArrowHandlesProps {
  arrow: ArrowItem | null;
  stageRef: React.RefObject<Konva.Stage | null>;
  updateItem: (id: string, payload: Partial<WhiteboardItem>) => void;
}

export function useArrowHandles({
  arrow,
  stageRef,
  updateItem,
}: UseArrowHandlesProps) {
  const [selectedHandleIndex, setSelectedHandleIndex] = useState<number | null>(
    null,
  );
  // 드래그 중인 points를 로컬 상태로 관리
  const [draggingPoints, setDraggingPoints] = useState<number[] | null>(null);

  // 화살표 더블클릭 - 중간점 추가
  const handleArrowDblClick = (arrowId: string) => {
    if (!arrow || !stageRef.current) return;

    const stage = stageRef.current;
    const worldPos = getWorldPointerPosition(stage);

    const worldX = worldPos.x;
    const worldY = worldPos.y;

    // 가장 가까운 선분 찾기
    let minDistance = Infinity;
    let insertIndex = 2;

    for (let i = 0; i < arrow.points.length - 2; i += 2) {
      const x1 = arrow.points[i];
      const y1 = arrow.points[i + 1];
      const x2 = arrow.points[i + 2];
      const y2 = arrow.points[i + 3];

      const distance = pointToSegmentDistance(worldX, worldY, x1, y1, x2, y2);

      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 2;
      }
    }

    // 중간 point 삽입
    const newPoints = [
      ...arrow.points.slice(0, insertIndex),
      worldX,
      worldY,
      ...arrow.points.slice(insertIndex),
    ];

    updateItem(arrowId, { points: newPoints });
  };

  // 화살표 핸들 클릭
  const handleHandleClick = (
    e: KonvaEventObject<MouseEvent>,
    index: number,
  ) => {
    e.cancelBubble = true;
    setSelectedHandleIndex(index);
  };

  // 화살표 시작점 드래그
  const handleArrowStartDrag = (e: KonvaEventObject<DragEvent>) => {
    if (!arrow) return;

    const { x, y } = e.target.position();
    const newPoints = [...(draggingPoints || arrow.points)];
    newPoints[0] = x;
    newPoints[1] = y;

    setDraggingPoints(newPoints);
  };

  // 화살표 중간점 드래그
  const handleArrowControlPointDrag = (
    pointIndex: number,
    e: KonvaEventObject<DragEvent>,
  ) => {
    if (!arrow) return;

    const { x, y } = e.target.position();
    const newPoints = [...(draggingPoints || arrow.points)];
    newPoints[pointIndex] = x;
    newPoints[pointIndex + 1] = y;

    setDraggingPoints(newPoints);
  };

  // 화살표 끝점 드래그
  const handleArrowEndDrag = (e: KonvaEventObject<DragEvent>) => {
    if (!arrow) return;

    const { x, y } = e.target.position();
    const newPoints = [...(draggingPoints || arrow.points)];
    newPoints[newPoints.length - 2] = x;
    newPoints[newPoints.length - 1] = y;

    setDraggingPoints(newPoints);
  };

  // 핸들 드래그 종료 시 store에 반영
  const handleHandleDragEnd = () => {
    if (!arrow || !draggingPoints) return;

    updateItem(arrow.id, { points: draggingPoints });
    setDraggingPoints(null);
  };

  // 화살표 중간점 삭제
  const deleteControlPoint = () => {
    if (!arrow || selectedHandleIndex === null) return false;

    // 중간점만 삭제 가능 (시작점, 끝점은 삭제 불가)
    if (
      selectedHandleIndex >= 2 &&
      selectedHandleIndex < arrow.points.length - 2
    ) {
      const newPoints = [...arrow.points];
      newPoints.splice(selectedHandleIndex, 2);

      // point 4개는 유지 (x1,y1,x2,y2) => 직선
      if (newPoints.length >= 4) {
        updateItem(arrow.id, { points: newPoints });
        setSelectedHandleIndex(null);
        return true;
      }
    }

    return false;
  };

  return {
    selectedHandleIndex,
    setSelectedHandleIndex,
    handleHandleClick,
    handleArrowStartDrag,
    handleArrowControlPointDrag,
    handleArrowEndDrag,
    handleHandleDragEnd,
    handleArrowDblClick,
    deleteControlPoint,
    draggingPoints,
  };
}
