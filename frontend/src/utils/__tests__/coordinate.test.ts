import { screenToWorld, getCenterWorldPos } from '@/utils/coordinate';

describe('coordinate utils', () => {
  describe('screenToWorld', () => {
    it('스케일 1, 위치 (0,0)일 때 좌표 변환', () => {
      const result = screenToWorld(100, 200, { x: 0, y: 0 }, 1);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('스케일 2배일 때 좌표 변환', () => {
      const result = screenToWorld(200, 400, { x: 0, y: 0 }, 2);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('스케일 0.5배일 때 좌표 변환', () => {
      const result = screenToWorld(100, 200, { x: 0, y: 0 }, 0.5);

      expect(result).toEqual({ x: 200, y: 400 });
    });

    it('Stage 위치가 이동했을 때 좌표 변환', () => {
      const result = screenToWorld(200, 300, { x: 50, y: 100 }, 1);

      expect(result).toEqual({ x: 150, y: 200 });
    });

    it('Stage 위치 이동 + 스케일 2배', () => {
      const result = screenToWorld(300, 400, { x: 100, y: 200 }, 2);

      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('음수 Stage 위치', () => {
      const result = screenToWorld(100, 200, { x: -50, y: -100 }, 1);

      expect(result).toEqual({ x: 150, y: 300 });
    });

    it('음수 화면 좌표', () => {
      const result = screenToWorld(-100, -200, { x: 0, y: 0 }, 1);

      expect(result).toEqual({ x: -100, y: -200 });
    });

    it('소수점 좌표 처리', () => {
      const result = screenToWorld(123.45, 678.9, { x: 10.5, y: 20.3 }, 1.5);

      expect(result.x).toBeCloseTo(75.3, 1);
      expect(result.y).toBeCloseTo(439.07, 1);
    });

    it('매우 큰 스케일 (10배 줌인)', () => {
      const result = screenToWorld(1000, 2000, { x: 0, y: 0 }, 10);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('매우 작은 스케일 (0.1배 줌아웃)', () => {
      const result = screenToWorld(100, 200, { x: 0, y: 0 }, 0.1);

      expect(result).toEqual({ x: 1000, y: 2000 });
    });

    it('중앙 정렬된 캔버스', () => {
      const stagePos = { x: 460, y: 140 }; // (1920-1000)/2, (1080-800)/2
      const screenX = 960; // 화면 중앙
      const screenY = 540;

      const result = screenToWorld(screenX, screenY, stagePos, 1);

      expect(result).toEqual({ x: 500, y: 400 }); // 캔버스 중앙
    });

    it('줌인 후 드래그', () => {
      const result = screenToWorld(400, 600, { x: -100, y: -200 }, 2);

      expect(result).toEqual({ x: 250, y: 400 });
    });
  });

  describe('getCenterWorldPos', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: originalInnerHeight,
      });
    });

    it('스케일 1, 위치 (0,0)일 때 화면 중앙의 World 좌표', () => {
      const result = getCenterWorldPos({ x: 0, y: 0 }, 1);

      expect(result).toEqual({ x: 960, y: 540 });
    });

    it('스케일 2배일 때 화면 중앙의 World 좌표', () => {
      const result = getCenterWorldPos({ x: 0, y: 0 }, 2);

      expect(result).toEqual({ x: 480, y: 270 });
    });

    it('Stage가 이동했을 때 화면 중앙의 World 좌표', () => {
      const result = getCenterWorldPos({ x: 100, y: 200 }, 1);

      expect(result).toEqual({ x: 860, y: 340 });
    });

    it('커스텀 뷰포트 크기 사용', () => {
      const result = getCenterWorldPos({ x: 0, y: 0 }, 1, 1024, 768);

      expect(result).toEqual({ x: 512, y: 384 });
    });

    it('스케일 0.5배 + Stage 이동', () => {
      const result = getCenterWorldPos({ x: -100, y: -200 }, 0.5);

      expect(result).toEqual({ x: 2120, y: 1480 });
    });

    it('중앙 정렬된 캔버스에서 중심점', () => {
      const stagePos = { x: 460, y: 140 };
      const result = getCenterWorldPos(stagePos, 1);

      expect(result).toEqual({ x: 500, y: 400 }); // 캔버스 중앙
    });

    it('2배 줌인 상태', () => {
      const stagePos = { x: -100, y: -200 };
      const result = getCenterWorldPos(stagePos, 2);

      expect(result).toEqual({ x: 530, y: 370 });
    });

    it('소수점 스케일', () => {
      const result = getCenterWorldPos({ x: 0, y: 0 }, 1.5);

      expect(result.x).toBeCloseTo(640, 1);
      expect(result.y).toBeCloseTo(360, 1);
    });

    it('매우 큰 스케일 (10배)', () => {
      const result = getCenterWorldPos({ x: 0, y: 0 }, 10);

      expect(result).toEqual({ x: 96, y: 54 });
    });

    it('매우 작은 스케일 (0.1배)', () => {
      const result = getCenterWorldPos({ x: 0, y: 0 }, 0.1);

      expect(result).toEqual({ x: 9600, y: 5400 });
    });
  });
});
