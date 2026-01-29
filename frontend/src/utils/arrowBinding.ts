import type { ArrowItem, ShapeItem, WhiteboardItem } from '@/types/whiteboard';
import {
  getIntersectingPoint,
  rotatePoint,
  type Shape,
  type Point,
} from '@/utils/geom';

const ARROW_MARGIN = 10; // 화살표와 도형 사이의 간격

//도형  위치 변경시 연결된 화살표들의 부착 지점을 업데이트
export function updateBoundArrows(
  shapeId: string,
  updatedShape: ShapeItem,
  items: WhiteboardItem[],
  updateItem: (id: string, attrs: Partial<WhiteboardItem>) => void,
) {
  // 해당 도형에 바인딩된 화살표 찾기
  const boundArrows = items.filter(
    (item) =>
      item.type === 'arrow' &&
      (item.startBinding?.elementId === shapeId ||
        item.endBinding?.elementId === shapeId),
  ) as ArrowItem[];

  // 도형의 실제 중심점 계산
  const rotation = updatedShape.rotation || 0;
  const center = rotatePoint(
    {
      x: updatedShape.x + updatedShape.width / 2,
      y: updatedShape.y + updatedShape.height / 2,
    },
    { x: updatedShape.x, y: updatedShape.y },
    rotation,
  );

  const shapeCenterX = center.x;
  const shapeCenterY = center.y;

  boundArrows.forEach((arrow) => {
    if (!arrow.points || arrow.points.length < 4) return;

    const newPoints = [...arrow.points];
    let hasChange = false;

    // 시작점 업데이트
    if (arrow.startBinding?.elementId === shapeId) {
      const nextPoint = { x: newPoints[2], y: newPoints[3] };
      const result = updateBindingPoint(
        updatedShape,
        shapeCenterX,
        shapeCenterY,
        nextPoint,
      );

      newPoints[0] = result.x;
      newPoints[1] = result.y;
      arrow.startBinding.position = result.position;
      hasChange = true;
    }

    // 끝점 업데이트
    if (arrow.endBinding?.elementId === shapeId) {
      const prevPoint = {
        x: newPoints[newPoints.length - 4],
        y: newPoints[newPoints.length - 3],
      };
      const result = updateBindingPoint(
        updatedShape,
        shapeCenterX,
        shapeCenterY,
        prevPoint,
      );

      newPoints[newPoints.length - 2] = result.x;
      newPoints[newPoints.length - 1] = result.y;
      arrow.endBinding.position = result.position;
      hasChange = true;
    }

    // 화살표 업데이트
    if (hasChange) {
      updateItem(arrow.id, {
        points: newPoints,
        startBinding: arrow.startBinding,
        endBinding: arrow.endBinding,
      });
    }
  });
}

export function updateBindingPoint(
  shape: Shape,
  shapeCenterX: number,
  shapeCenterY: number,
  targetPoint: Point,
) {
  // 도형 경계와의 교차점 계산
  const intersect = getIntersectingPoint(
    {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation || 0,
      type: shape.shapeType || shape.type,
    },
    targetPoint,
  );

  // 중심에서 바깥쪽으로 마진만큼 이동
  const angle = Math.atan2(
    intersect.y - shapeCenterY,
    intersect.x - shapeCenterX,
  );

  return {
    x: intersect.x + Math.cos(angle) * ARROW_MARGIN,
    y: intersect.y + Math.sin(angle) * ARROW_MARGIN,
    position: {
      x: (intersect.x - shape.x) / shape.width,
      y: (intersect.y - shape.y) / shape.height,
    },
  };
}

export function getDraggingArrowPoints(
  arrow: ArrowItem,
  draggingId: string,
  draggingX: number,
  draggingY: number,
  targetShape: ShapeItem,
  draggingWidth?: number,
  draggingHeight?: number,
  draggingRotation?: number,
): number[] | null {
  const isStartBound = arrow.startBinding?.elementId === draggingId;
  const isEndBound = arrow.endBinding?.elementId === draggingId;

  if (!isStartBound && !isEndBound) return null;

  if (!targetShape) return null;

  const rotation =
    draggingRotation !== undefined
      ? draggingRotation
      : targetShape.rotation || 0;
  const tempShape = {
    ...targetShape,
    x: draggingX,
    y: draggingY,
    width: draggingWidth ?? targetShape.width,
    height: draggingHeight ?? targetShape.height,
    rotation,
  };
  const center = rotatePoint(
    {
      x: tempShape.x + tempShape.width / 2,
      y: tempShape.y + tempShape.height / 2,
    },
    { x: tempShape.x, y: tempShape.y },
    rotation,
  );

  const shapeCenterX = center.x;
  const shapeCenterY = center.y;

  if (!arrow.points) return null;
  const newPoints = [...arrow.points];

  if (isStartBound) {
    const nextPoint = { x: newPoints[2], y: newPoints[3] };
    const result = updateBindingPoint(
      {
        ...tempShape,
        type: tempShape.shapeType,
      },
      shapeCenterX,
      shapeCenterY,
      nextPoint,
    );
    newPoints[0] = result.x;
    newPoints[1] = result.y;
  }

  if (isEndBound) {
    const prevPoint = {
      x: newPoints[newPoints.length - 4],
      y: newPoints[newPoints.length - 3],
    };
    const result = updateBindingPoint(
      {
        ...tempShape,
        type: tempShape.shapeType,
      },
      shapeCenterX,
      shapeCenterY,
      prevPoint,
    );
    newPoints[newPoints.length - 2] = result.x;
    newPoints[newPoints.length - 1] = result.y;
  }

  return newPoints;
}
