import {
  rotatePoint,
  getNearestSnapPoint,
  getPointFromNormalized,
  getIntersectingPoint,
  type Shape,
} from '@/utils/geom';

describe('geom utils', () => {
  describe('rotatePoint', () => {
    it('회전 각도가 0이면 원래 점을 반환한다', () => {
      const point = { x: 100, y: 50 };
      const center = { x: 0, y: 0 };
      const result = rotatePoint(point, center, 0);

      expect(result).toEqual(point);
    });

    it('원점 기준 90도 회전', () => {
      const point = { x: 100, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePoint(point, center, 90);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(100, 5);
    });

    it('원점 기준 180도 회전', () => {
      const point = { x: 100, y: 50 };
      const center = { x: 0, y: 0 };
      const result = rotatePoint(point, center, 180);

      expect(result.x).toBeCloseTo(-100, 5);
      expect(result.y).toBeCloseTo(-50, 5);
    });

    it('원점 기준 -90도 회전', () => {
      const point = { x: 100, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePoint(point, center, -90);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(-100, 5);
    });

    it('임의의 중심점 기준 회전', () => {
      const point = { x: 150, y: 100 };
      const center = { x: 100, y: 100 };
      const result = rotatePoint(point, center, 90);

      expect(result.x).toBeCloseTo(100, 5);
      expect(result.y).toBeCloseTo(150, 5);
    });

    it('45도 회전', () => {
      const point = { x: 100, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePoint(point, center, 45);

      const expected = 100 / Math.sqrt(2);
      expect(result.x).toBeCloseTo(expected, 5);
      expect(result.y).toBeCloseTo(expected, 5);
    });
  });

  describe('getNearestSnapPoint', () => {
    describe('사각형', () => {
      const rectShape: Shape = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        type: 'rectangle',
      };

      it('점이 사각형 위쪽에 있으면 상단 테두리에 붙음', () => {
        const point = { x: 50, y: -10 };
        const result = getNearestSnapPoint(rectShape, point);

        expect(result.x).toBeCloseTo(50, 5);
        expect(result.y).toBeCloseTo(0, 5);
        expect(result.position.x).toBeCloseTo(0.5, 5);
        expect(result.position.y).toBeCloseTo(0, 5);
      });

      it('점이 사각형 아래쪽에 있으면 하단 테두리에 붙음', () => {
        const point = { x: 50, y: 110 };
        const result = getNearestSnapPoint(rectShape, point);

        expect(result.x).toBeCloseTo(50, 5);
        expect(result.y).toBeCloseTo(100, 5);
      });

      it('점이 사각형 왼쪽에 있으면 좌측 테두리에 붙음', () => {
        const point = { x: -10, y: 50 };
        const result = getNearestSnapPoint(rectShape, point);

        expect(result.x).toBeCloseTo(0, 5);
        expect(result.y).toBeCloseTo(50, 5);
      });

      it('점이 사각형 오른쪽에 있으면 우측 테두리에 붙음', () => {
        const point = { x: 110, y: 50 };
        const result = getNearestSnapPoint(rectShape, point);

        expect(result.x).toBeCloseTo(100, 5);
        expect(result.y).toBeCloseTo(50, 5);
      });

      it('점이 사각형 모서리 근처에 있으면 모서리에 붙음', () => {
        const point = { x: -5, y: -5 };
        const result = getNearestSnapPoint(rectShape, point);

        expect(result.x).toBeCloseTo(0, 5);
        expect(result.y).toBeCloseTo(0, 5);
      });
    });

    describe('원', () => {
      const circleShape: Shape = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        type: 'circle',
      };

      it('점이 원 위쪽에 있으면 상단 테두리에 붙음', () => {
        const point = { x: 50, y: -10 };
        const result = getNearestSnapPoint(circleShape, point);

        expect(result.x).toBeCloseTo(50, 5);
        expect(result.y).toBeCloseTo(0, 5);
      });

      it('점이 원 오른쪽에 있으면 우측 테두리에 붙음', () => {
        const point = { x: 110, y: 50 };
        const result = getNearestSnapPoint(circleShape, point);

        expect(result.x).toBeCloseTo(100, 5);
        expect(result.y).toBeCloseTo(50, 5);
      });

      it('점이 원 대각선 방향에 있으면 대각선 테두리에 붙음', () => {
        const point = { x: 100, y: 0 };
        const result = getNearestSnapPoint(circleShape, point);

        const expected = 50 + 50 / Math.sqrt(2);
        expect(result.x).toBeCloseTo(expected, 1);
        expect(result.y).toBeCloseTo(50 - 50 / Math.sqrt(2), 1);
      });
    });

    describe('회전된 도형', () => {
      it('45도 회전된 사각형', () => {
        const rotatedRect: Shape = {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 45,
          type: 'rectangle',
        };

        const point = { x: 50, y: -50 };
        const result = getNearestSnapPoint(rotatedRect, point);

        expect(result.x).toBeDefined();
        expect(result.y).toBeDefined();
      });
    });
  });

  describe('getPointFromNormalized', () => {
    it('정규화 좌표 (0, 0)은 사각형 좌상단', () => {
      const rect = { x: 100, y: 100, width: 200, height: 150 };
      const position = { x: 0, y: 0 };
      const result = getPointFromNormalized(rect, position);

      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('정규화 좌표 (1, 1)은 사각형 우하단', () => {
      const rect = { x: 100, y: 100, width: 200, height: 150 };
      const position = { x: 1, y: 1 };
      const result = getPointFromNormalized(rect, position);

      expect(result).toEqual({ x: 300, y: 250 });
    });

    it('정규화 좌표 (0.5, 0.5)는 사각형 중심', () => {
      const rect = { x: 100, y: 100, width: 200, height: 150 };
      const position = { x: 0.5, y: 0.5 };
      const result = getPointFromNormalized(rect, position);

      expect(result).toEqual({ x: 200, y: 175 });
    });

    it('정규화 좌표 (0.25, 0.75)', () => {
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      const position = { x: 0.25, y: 0.75 };
      const result = getPointFromNormalized(rect, position);

      expect(result).toEqual({ x: 25, y: 75 });
    });
  });

  describe('getIntersectingPoint', () => {
    describe('사각형', () => {
      const rectShape: Shape = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        type: 'rectangle',
      };

      it('중심에서 위쪽 방향 교차점', () => {
        const targetPoint = { x: 50, y: -100 };
        const result = getIntersectingPoint(rectShape, targetPoint);

        expect(result.x).toBeCloseTo(50, 5);
        expect(result.y).toBeCloseTo(0, 5);
      });

      it('중심에서 아래쪽 방향 교차점', () => {
        const targetPoint = { x: 50, y: 200 };
        const result = getIntersectingPoint(rectShape, targetPoint);

        expect(result.x).toBeCloseTo(50, 5);
        expect(result.y).toBeCloseTo(100, 5);
      });

      it('중심에서 왼쪽 방향 교차점', () => {
        const targetPoint = { x: -100, y: 50 };
        const result = getIntersectingPoint(rectShape, targetPoint);

        expect(result.x).toBeCloseTo(0, 5);
        expect(result.y).toBeCloseTo(50, 5);
      });

      it('중심에서 오른쪽 방향 교차점', () => {
        const targetPoint = { x: 200, y: 50 };
        const result = getIntersectingPoint(rectShape, targetPoint);

        expect(result.x).toBeCloseTo(100, 5);
        expect(result.y).toBeCloseTo(50, 5);
      });

      it('중심에서 대각선 방향 교차점', () => {
        const targetPoint = { x: 150, y: 150 };
        const result = getIntersectingPoint(rectShape, targetPoint);

        expect(result.x).toBeCloseTo(100, 5);
        expect(result.y).toBeCloseTo(100, 5);
      });

      it('중심과 동일한 점은 중심을 반환', () => {
        const targetPoint = { x: 50, y: 50 };
        const result = getIntersectingPoint(rectShape, targetPoint);

        expect(result.x).toBe(50);
        expect(result.y).toBe(50);
      });
    });

    describe('원', () => {
      const circleShape: Shape = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        type: 'circle',
      };

      it('중심에서 위쪽 방향 교차점', () => {
        const targetPoint = { x: 50, y: -100 };
        const result = getIntersectingPoint(circleShape, targetPoint);

        expect(result.x).toBeCloseTo(50, 5);
        expect(result.y).toBeCloseTo(0, 5);
      });

      it('중심에서 오른쪽 방향 교차점', () => {
        const targetPoint = { x: 200, y: 50 };
        const result = getIntersectingPoint(circleShape, targetPoint);

        expect(result.x).toBeCloseTo(100, 5);
        expect(result.y).toBeCloseTo(50, 5);
      });

      it('중심에서 대각선 방향 교차점', () => {
        const targetPoint = { x: 150, y: 150 };
        const result = getIntersectingPoint(circleShape, targetPoint);

        const expected = 50 + 50 / Math.sqrt(2);
        expect(result.x).toBeCloseTo(expected, 1);
        expect(result.y).toBeCloseTo(expected, 1);
      });
    });

    describe('회전된 도형', () => {
      it('45도 회전된 사각형의 교차점', () => {
        const rotatedRect: Shape = {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 45,
          type: 'rectangle',
        };

        const targetPoint = { x: 50, y: -50 };
        const result = getIntersectingPoint(rotatedRect, targetPoint);

        expect(result.x).toBeDefined();
        expect(result.y).toBeDefined();
      });
    });
  });
});
