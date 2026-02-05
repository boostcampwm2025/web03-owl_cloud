import { getControlPoints, pointToSegmentDistance } from '@/utils/arrow';

describe('arrow utils', () => {
  describe('getControlPoints', () => {
    it('시작점과 끝점을 제외한 중간점들만 반환한다', () => {
      const points = [0, 0, 50, 50, 100, 100, 150, 150];
      const result = getControlPoints(points);

      expect(result).toEqual([
        { x: 50, y: 50, index: 2 },
        { x: 100, y: 100, index: 4 },
      ]);
    });

    it('중간점이 없으면 빈 배열을 반환한다', () => {
      // [시작점(0,0), 끝점(100,100)]
      const points = [0, 0, 100, 100];
      const result = getControlPoints(points);

      expect(result).toEqual([]);
    });

    it('중간점이 1개만 있어도 정상 동작한다', () => {
      // [시작점(0,0), 중간점(50,50), 끝점(100,100)]
      const points = [0, 0, 50, 50, 100, 100];
      const result = getControlPoints(points);

      expect(result).toEqual([{ x: 50, y: 50, index: 2 }]);
    });

    it('여러 중간점이 있어도 정상 동작한다', () => {
      const points = [0, 0, 25, 25, 50, 50, 75, 75, 100, 100];
      const result = getControlPoints(points);

      expect(result).toEqual([
        { x: 25, y: 25, index: 2 },
        { x: 50, y: 50, index: 4 },
        { x: 75, y: 75, index: 6 },
      ]);
    });

    it('음수 좌표도 정상 처리한다', () => {
      const points = [-100, -100, -50, -50, 0, 0];
      const result = getControlPoints(points);

      expect(result).toEqual([{ x: -50, y: -50, index: 2 }]);
    });

    it('소수점 좌표도 정상 처리한다', () => {
      const points = [0, 0, 33.5, 66.7, 100, 100];
      const result = getControlPoints(points);

      expect(result).toEqual([{ x: 33.5, y: 66.7, index: 2 }]);
    });
  });

  describe('pointToSegmentDistance', () => {
    it('점이 선분 위에 있으면 거리는 0이다', () => {
      const distance = pointToSegmentDistance(50, 0, 0, 0, 100, 0);
      expect(distance).toBe(0);
    });

    it('점이 선분에 수직으로 가까우면 수직 거리를 반환한다', () => {
      const distance = pointToSegmentDistance(50, 10, 0, 0, 100, 0);
      expect(distance).toBe(10);
    });

    it('점이 선분 시작점 너머에 있으면 시작점까지의 거리를 반환한다', () => {
      const distance = pointToSegmentDistance(-10, 0, 0, 0, 100, 0);
      expect(distance).toBe(10);
    });

    it('점이 선분 끝점 너머에 있으면 끝점까지의 거리를 반환한다', () => {
      const distance = pointToSegmentDistance(110, 0, 0, 0, 100, 0);
      expect(distance).toBe(10);
    });

    it('대각선 선분에 대해서도 정상 동작한다', () => {
      const distance = pointToSegmentDistance(50, 50, 0, 0, 100, 100);
      expect(distance).toBeCloseTo(0, 5);
    });

    it('대각선 선분에서 떨어진 점의 거리를 계산한다', () => {
      const distance = pointToSegmentDistance(0, 100, 0, 0, 100, 100);
      const expected = Math.hypot(50, 50);
      expect(distance).toBeCloseTo(expected, 1);
    });

    it('선분 길이가 0이면 시작점까지의 거리를 반환한다', () => {
      const distance = pointToSegmentDistance(60, 60, 50, 50, 50, 50);
      const expected = Math.hypot(10, 10);
      expect(distance).toBeCloseTo(expected, 1);
    });

    it('수직 선분에 대해서도 정상 동작한다', () => {
      const distance = pointToSegmentDistance(60, 50, 50, 0, 50, 100);
      expect(distance).toBe(10);
    });

    it('음수 좌표도 정상 처리한다', () => {
      const distance = pointToSegmentDistance(-50, 10, -100, 0, 0, 0);
      expect(distance).toBe(10);
    });

    it('소수점 좌표도 정상 처리한다', () => {
      const distance = pointToSegmentDistance(50.25, 5.5, 0, 0, 100.5, 0);
      expect(distance).toBe(5.5);
    });

    it('매우 가까운 거리도 정확히 계산한다', () => {
      const distance = pointToSegmentDistance(50, 0.1, 0, 0, 100, 0);
      expect(distance).toBeCloseTo(0.1, 5);
    });

    it('매우 먼 거리도 정확히 계산한다', () => {
      const distance = pointToSegmentDistance(50, 1000, 0, 0, 100, 0);
      expect(distance).toBe(1000);
    });
  });
});
