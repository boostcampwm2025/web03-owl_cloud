export interface Shape {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  type?: string;
  shapeType?: string;
}

export interface Point {
  x: number;
  y: number;
}

// 점 회전 변환
export function rotatePoint(
  point: Point,
  center: Point,
  angleDegrees: number,
): Point {
  if (angleDegrees === 0) return point;

  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

// 점과 도형 사이의 가장 가까운 테두리 좌표 계산
export function getNearestSnapPoint(shape: Shape, point: Point) {
  const { x, y, width, height, rotation = 0, type } = shape;

  // 점을 도형의 로컬 좌표계(그룹 원점 기준)로 변환
  const localPoint = rotatePoint(point, { x, y }, -rotation);

  let snapX = localPoint.x;
  let snapY = localPoint.y;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  if (type === 'circle') {
    //원 위의 가장 가까운 점 계산
    const dx = localPoint.x - centerX;
    const dy = localPoint.y - centerY;
    const angle = Math.atan2(dy, dx);
    snapX = centerX + (width / 2) * Math.cos(angle);
    snapY = centerY + (height / 2) * Math.sin(angle);
  } else {
    // 사각형 위의 가장 가까운 점 계산
    const clampedX = Math.max(x, Math.min(x + width, localPoint.x));
    const clampedY = Math.max(y, Math.min(y + height, localPoint.y));

    const dt = Math.abs(clampedY - y); // 상
    const db = Math.abs(clampedY - (y + height)); // 하
    const dl = Math.abs(clampedX - x); // 좌
    const dr = Math.abs(clampedX - (x + width)); // 우

    const min = Math.min(dt, db, dl, dr);

    snapX = clampedX;
    snapY = clampedY;

    if (min === dl) snapX = x;
    else if (min === dr) snapX = x + width;
    else if (min === dt) snapY = y;
    else snapY = y + height;
  }

  const globalSnapPoint = rotatePoint(
    { x: snapX, y: snapY },
    { x, y },
    rotation,
  );

  // 사각형 기준 정규화 좌표(0~1)
  const position = {
    x: (snapX - x) / width,
    y: (snapY - y) / height,
  };

  return { x: globalSnapPoint.x, y: globalSnapPoint.y, position };
}

// 정규화 좌표(0~1)를 실제 사각형 좌표로 변환
export const getPointFromNormalized = (
  rect: { x: number; y: number; width: number; height: number },
  position: { x: number; y: number },
) => {
  return {
    x: rect.x + rect.width * position.x,
    y: rect.y + rect.height * position.y,
  };
};

// 도형 중심에서 targetPoint 방향으로 만나는 테두리 교차점 계산
export const getIntersectingPoint = (shape: Shape, targetPoint: Point) => {
  const { x, y, width, height, rotation = 0, type } = shape;
  // 로컬 상의 중심
  const lcx = x + width / 2;
  const lcy = y + height / 2;

  // 글로벌 점을 도형의 로컬 좌표계로 변환 (기준점 x, y 사용)
  const localTarget = rotatePoint(targetPoint, { x, y }, -rotation);

  const dx = localTarget.x - lcx;
  const dy = localTarget.y - lcy;

  // 중심과 동일한 경우
  if (dx === 0 && dy === 0) return { x: lcx, y: lcy };

  let localIntersect;

  if (type === 'circle') {
    // 원 교차점 계산
    const a = width / 2;
    const b = height / 2;
    const scale = Math.sqrt((dx / a) ** 2 + (dy / b) ** 2);
    localIntersect = {
      x: lcx + dx / scale,
      y: lcy + dy / scale,
    };
  } else {
    // 사각형 교차점 계산
    const hw = width / 2;
    const hh = height / 2;

    const scaleX = Math.abs(dx) / hw;
    const scaleY = Math.abs(dy) / hh;

    const scale = Math.max(scaleX, scaleY);

    localIntersect = {
      x: lcx + dx / scale,
      y: lcy + dy / scale,
    };
  }

  return rotatePoint(localIntersect, { x, y }, rotation);
};
