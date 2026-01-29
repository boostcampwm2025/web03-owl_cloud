import { useState, useRef } from 'react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import type {
  ArrowItem,
  LineItem,
  WhiteboardItem,
  ShapeItem,
} from '@/types/whiteboard';
import { pointToSegmentDistance } from '@/utils/arrow';
import { getWorldPointerPosition } from '@/utils/coordinate';
import { getNearestSnapPoint } from '@/utils/geom';

interface UseArrowHandlesProps {
  arrow: ArrowItem | LineItem | null;
  items: WhiteboardItem[];
  stageRef: React.RefObject<Konva.Stage | null>;
  updateItem: (id: string, payload: Partial<WhiteboardItem>) => void;
}

export function useArrowHandles({
  arrow,
  items,
  stageRef,
  updateItem,
}: UseArrowHandlesProps) {
  const [selectedHandleIndex, setSelectedHandleIndex] = useState<number | null>(
    null,
  );

  // 드래그 중인 points를 로컬 상태로 관리
  const [draggingPoints, setDraggingPoints] = useState<number[] | null>(null);

  // 부착 표시 (현재 어디에 부착될지 보여주는 상태)
  const [snapIndicator, setSnapIndicator] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  } | null>(null);

  // 현재 부착된 타겟 정보 (드래그 종료 시 저장용)
  const currentSnapTarget = useRef<{
    elementId: string;
    position: { x: number; y: number };
  } | null>(null);

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

  // 부착 로직 함수 (arrow 타입만 부착 지원)
  const checkSnapping = (x: number, y: number) => {
    // line 타입은 부착 기능 비활성화
    if (arrow?.type === 'line') {
      return { x, y };
    }

    // 도형만 부착
    const shapes = items.filter((item) => item.type === 'shape') as ShapeItem[];

    let closestDist = 20; // 부착 감지 거리
    let foundSnap = null;

    for (const shape of shapes) {
      const {
        x: sx,
        y: sy,
        position,
      } = getNearestSnapPoint(
        {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          rotation: shape.rotation,
          type: shape.shapeType || shape.type,
        },
        { x, y },
      );

      const dist = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        foundSnap = {
          x: sx,
          y: sy,
          elementId: shape.id,
          position,
          shapeBox: {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
            rotation: shape.rotation,
          },
        };
      }
    }

    if (foundSnap) {
      setSnapIndicator({
        x: foundSnap.shapeBox.x,
        y: foundSnap.shapeBox.y,
        width: foundSnap.shapeBox.width,
        height: foundSnap.shapeBox.height,
        rotation: foundSnap.shapeBox.rotation,
      });
      currentSnapTarget.current = {
        elementId: foundSnap.elementId,
        position: foundSnap.position,
      };
      return { x: foundSnap.x, y: foundSnap.y };
    } else {
      setSnapIndicator(null);
      currentSnapTarget.current = null;
      return { x, y };
    }
  };

  // 화살표 시작점 드래그
  const handleArrowStartDrag = (e: KonvaEventObject<DragEvent>) => {
    if (!arrow) return;

    const { x, y } = e.target.position();
    // 부착 체크
    const snappedPos = checkSnapping(x, y);

    const newPoints = [...(draggingPoints || arrow.points)];
    newPoints[0] = snappedPos.x;
    newPoints[1] = snappedPos.y;

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
    // 부착 체크
    const snappedPos = checkSnapping(x, y);

    const newPoints = [...(draggingPoints || arrow.points)];
    newPoints[newPoints.length - 2] = snappedPos.x;
    newPoints[newPoints.length - 1] = snappedPos.y;

    setDraggingPoints(newPoints);
  };

  // 핸들 드래그 종료 시 store에 반영
  const handleHandleDragEnd = (handleType: 'start' | 'end' | 'mid') => {
    if (!arrow || !draggingPoints) return;

    const updates: Partial<ArrowItem> = { points: draggingPoints };

    // 바인딩 정보 업데이트
    if (handleType === 'start') {
      if (currentSnapTarget.current) {
        updates.startBinding = currentSnapTarget.current;
      } else {
        // 빈 공간에 놓으면 바인딩 해제
        updates.startBinding = null;
      }
    } else if (handleType === 'end') {
      if (currentSnapTarget.current) {
        updates.endBinding = currentSnapTarget.current;
      } else {
        updates.endBinding = null;
      }
    }

    updateItem(arrow.id, updates);

    setDraggingPoints(null);
    setSnapIndicator(null);
    currentSnapTarget.current = null;
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
    snapIndicator,
  };
}
