import {
  isIntersecting,
  getItemBoundingBox,
  filterVisibleItems,
  type Rect,
} from '@/utils/viewport';
import type { WhiteboardItem } from '@/types/whiteboard';

describe('viewport utils', () => {
  describe('isIntersecting', () => {
    it('완전히 겹치는 사각형', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(true);
    });

    it('부분적으로 겹치는 사각형', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 50, y: 50, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(true);
    });

    it('한 사각형이 다른 사각형 안에 있음', () => {
      const a: Rect = { x: 0, y: 0, width: 200, height: 200 };
      const b: Rect = { x: 50, y: 50, width: 50, height: 50 };

      expect(isIntersecting(a, b)).toBe(true);
    });

    it('테두리만 닿음 (오른쪽) - 경계도 겹침으로 판정', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 100, y: 0, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(true);
    });

    it('테두리만 닿음 (아래) - 경계도 겹침으로 판정', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 0, y: 100, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(true);
    });

    it('완전히 떨어진 사각형 (오른쪽)', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 200, y: 0, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(false);
    });

    it('완전히 떨어진 사각형 (아래)', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 0, y: 200, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(false);
    });

    it('완전히 떨어진 사각형 (왼쪽)', () => {
      const a: Rect = { x: 100, y: 0, width: 100, height: 100 };
      const b: Rect = { x: -100, y: 0, width: 50, height: 100 };

      expect(isIntersecting(a, b)).toBe(false);
    });

    it('완전히 떨어진 사각형 (위)', () => {
      const a: Rect = { x: 0, y: 100, width: 100, height: 100 };
      const b: Rect = { x: 0, y: -100, width: 100, height: 50 };

      expect(isIntersecting(a, b)).toBe(false);
    });

    it('대각선으로 겹침', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 80, y: 80, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(true);
    });

    it('1px만 겹침', () => {
      const a: Rect = { x: 0, y: 0, width: 100, height: 100 };
      const b: Rect = { x: 99, y: 99, width: 100, height: 100 };

      expect(isIntersecting(a, b)).toBe(true);
    });
  });

  describe('getItemBoundingBox', () => {
    describe('shape', () => {
      it('기본 사각형', () => {
        const item = {
          type: 'shape',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
        } as WhiteboardItem;

        expect(getItemBoundingBox(item)).toEqual({
          x: 100,
          y: 200,
          width: 150,
          height: 100,
        });
      });
    });

    describe('image', () => {
      it('기본 이미지', () => {
        const item = {
          type: 'image',
          x: 50,
          y: 75,
          width: 200,
          height: 150,
        } as WhiteboardItem;

        expect(getItemBoundingBox(item)).toEqual({
          x: 50,
          y: 75,
          width: 200,
          height: 150,
        });
      });
    });

    describe('text', () => {
      it('단일 라인 텍스트', () => {
        const item = {
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          fontSize: 16,
          text: 'Hello',
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        expect(bbox.width).toBeGreaterThanOrEqual(600);
        expect(bbox.height).toBeGreaterThanOrEqual(48);

        expect(bbox.x).toBeLessThan(100);
        expect(bbox.y).toBeLessThan(100);
      });

      it('멀티 라인 텍스트', () => {
        const item = {
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          fontSize: 20,
          text: 'Line 1\nLine 2\nLine 3',
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        expect(bbox.height).toBeGreaterThanOrEqual(180);
      });

      it('텍스트가 없으면 기본값 사용', () => {
        const item = {
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          fontSize: 16,
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        expect(bbox.width).toBeGreaterThanOrEqual(600);
        expect(bbox.height).toBeGreaterThanOrEqual(48);
      });
    });

    describe('arrow', () => {
      it('기본 화살표', () => {
        const item = {
          type: 'arrow',
          points: [0, 0, 100, 100],
          strokeWidth: 2,
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        const padding = 2 * 2; // strokeWidth * 2
        expect(bbox.x).toBe(0 - padding);
        expect(bbox.y).toBe(0 - padding);
        expect(bbox.width).toBe(100 + padding * 2);
        expect(bbox.height).toBe(100 + padding * 2);
      });

      it('복잡한 경로', () => {
        const item = {
          type: 'arrow',
          points: [10, 20, 50, 80, 100, 30],
          strokeWidth: 4,
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        const padding = 4 * 2;
        expect(bbox.x).toBe(10 - padding);
        expect(bbox.y).toBe(20 - padding);
        expect(bbox.width).toBe(90 + padding * 2); // 100 - 10
        expect(bbox.height).toBe(60 + padding * 2); // 80 - 20
      });

      it('points가 없으면 빈 박스', () => {
        const item = {
          type: 'arrow',
          points: [],
          stroke: '#000000',
          strokeWidth: 2,
          pointerLength: 10,
          pointerWidth: 8,
          tension: 0,
        } as unknown as WhiteboardItem;

        expect(getItemBoundingBox(item)).toEqual({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
      });

      it('points가 2개 미만이면 빈 박스', () => {
        const item = {
          type: 'arrow',
          points: [10],
          stroke: '#000000',
          strokeWidth: 2,
          pointerLength: 10,
          pointerWidth: 8,
          tension: 0,
        } as unknown as WhiteboardItem;

        expect(getItemBoundingBox(item)).toEqual({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
      });
    });

    describe('line', () => {
      it('기본 선', () => {
        const item = {
          type: 'line',
          points: [0, 0, 200, 100],
          strokeWidth: 3,
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        const padding = 3 * 2;
        expect(bbox.x).toBe(0 - padding);
        expect(bbox.y).toBe(0 - padding);
        expect(bbox.width).toBe(200 + padding * 2);
        expect(bbox.height).toBe(100 + padding * 2);
      });
    });

    describe('drawing', () => {
      it('기본 그리기', () => {
        const item = {
          type: 'drawing',
          points: [10, 10, 20, 30, 50, 20],
          strokeWidth: 5,
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        const padding = 5 * 2;
        expect(bbox.x).toBe(10 - padding);
        expect(bbox.y).toBe(10 - padding);
        expect(bbox.width).toBe(40 + padding * 2); // 50 - 10
        expect(bbox.height).toBe(20 + padding * 2); // 30 - 10
      });

      it('strokeWidth가 없으면 기본값 2 사용', () => {
        const item = {
          type: 'drawing',
          points: [0, 0, 100, 100],
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        const padding = 2 * 2;
        expect(bbox.x).toBe(0 - padding);
        expect(bbox.y).toBe(0 - padding);
      });
    });

    describe('음수 좌표', () => {
      it('음수 좌표를 가진 arrow', () => {
        const item = {
          type: 'arrow',
          points: [-50, -30, 50, 30],
          strokeWidth: 2,
        } as WhiteboardItem;

        const bbox = getItemBoundingBox(item);

        const padding = 2 * 2;
        expect(bbox.x).toBe(-50 - padding);
        expect(bbox.y).toBe(-30 - padding);
        expect(bbox.width).toBe(100 + padding * 2);
        expect(bbox.height).toBe(60 + padding * 2);
      });
    });
  });

  describe('filterVisibleItems', () => {
    const viewport: Rect = { x: 0, y: 0, width: 1000, height: 800 };

    it('뷰포트 안에 있는 아이템만 반환', () => {
      const items: WhiteboardItem[] = [
        {
          id: 'item-1',
          type: 'shape',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
        } as WhiteboardItem,
        {
          id: 'item-2',
          type: 'shape',
          x: 2000,
          y: 2000,
          width: 50,
          height: 50,
        } as WhiteboardItem,
        {
          id: 'item-3',
          type: 'shape',
          x: 500,
          y: 500,
          width: 50,
          height: 50,
        } as WhiteboardItem,
      ];

      const visible = filterVisibleItems(items, viewport);

      expect(visible).toHaveLength(2);
      expect(visible[0].id).toBe('item-1');
      expect(visible[1].id).toBe('item-3');
    });

    it('부분적으로 겹치는 아이템도 포함', () => {
      const items: WhiteboardItem[] = [
        {
          type: 'shape',
          x: 950,
          y: 750,
          width: 100,
          height: 100,
        } as WhiteboardItem,
      ];

      const visible = filterVisibleItems(items, viewport);

      expect(visible).toHaveLength(1);
    });

    it('완전히 밖에 있는 아이템은 제외', () => {
      const items: WhiteboardItem[] = [
        {
          type: 'shape',
          x: -200,
          y: -200,
          width: 50,
          height: 50,
        } as WhiteboardItem,
        {
          type: 'shape',
          x: 2000,
          y: 2000,
          width: 50,
          height: 50,
        } as WhiteboardItem,
      ];

      const visible = filterVisibleItems(items, viewport);

      expect(visible).toHaveLength(0);
    });

    it('빈 배열 처리', () => {
      const items: WhiteboardItem[] = [];
      const visible = filterVisibleItems(items, viewport);

      expect(visible).toHaveLength(0);
    });

    it('다양한 타입의 아이템 필터링', () => {
      const items: WhiteboardItem[] = [
        {
          type: 'shape',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
        } as WhiteboardItem,
        {
          type: 'arrow',
          points: [200, 200, 300, 300],
          strokeWidth: 2,
        } as WhiteboardItem,
        {
          type: 'text',
          x: 500,
          y: 500,
          width: 100,
          fontSize: 16,
          text: 'Test',
        } as WhiteboardItem,
        {
          type: 'shape',
          x: 3000,
          y: 3000,
          width: 50,
          height: 50,
        } as WhiteboardItem,
      ];

      const visible = filterVisibleItems(items, viewport);

      expect(visible).toHaveLength(3); // shape, arrow, text (마지막 shape는 제외)
    });

    it('뷰포트 경계에 있는 아이템', () => {
      const items: WhiteboardItem[] = [
        { type: 'shape', x: 0, y: 0, width: 50, height: 50 } as WhiteboardItem,
        {
          type: 'shape',
          x: 950,
          y: 750,
          width: 50,
          height: 50,
        } as WhiteboardItem,
      ];

      const visible = filterVisibleItems(items, viewport);

      expect(visible).toHaveLength(2);
    });
  });
});
