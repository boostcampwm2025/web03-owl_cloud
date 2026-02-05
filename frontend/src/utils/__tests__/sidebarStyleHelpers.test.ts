import {
  getArrowSize,
  getLineSize,
  getTextSize,
  getDrawingSize,
  getItemStyle,
} from '@/utils/sidebarStyleHelpers';
import type {
  ArrowItem,
  LineItem,
  TextItem,
  DrawingItem,
} from '@/types/whiteboard';

describe('sidebarStyleHelpers', () => {
  describe('getArrowSize', () => {
    it('S: strokeWidth ≤ 2 && pointerLength ≤ 8', () => {
      expect(
        getArrowSize({ strokeWidth: 1, pointerLength: 5 } as ArrowItem),
      ).toBe('S');
      expect(
        getArrowSize({ strokeWidth: 2, pointerLength: 8 } as ArrowItem),
      ).toBe('S');
    });

    it('M: strokeWidth ≤ 4 && pointerLength ≤ 14', () => {
      expect(
        getArrowSize({ strokeWidth: 3, pointerLength: 10 } as ArrowItem),
      ).toBe('M');
      expect(
        getArrowSize({ strokeWidth: 4, pointerLength: 14 } as ArrowItem),
      ).toBe('M');
    });

    it('L: 그 외', () => {
      expect(
        getArrowSize({ strokeWidth: 5, pointerLength: 10 } as ArrowItem),
      ).toBe('L');
      expect(
        getArrowSize({ strokeWidth: 3, pointerLength: 15 } as ArrowItem),
      ).toBe('L');
    });

    it('경계값 테스트', () => {
      expect(
        getArrowSize({ strokeWidth: 2.1, pointerLength: 8 } as ArrowItem),
      ).toBe('M');
      expect(
        getArrowSize({ strokeWidth: 2, pointerLength: 8.1 } as ArrowItem),
      ).toBe('M');
      expect(
        getArrowSize({ strokeWidth: 4.1, pointerLength: 14 } as ArrowItem),
      ).toBe('L');
    });
  });

  describe('getLineSize', () => {
    it('S: strokeWidth ≤ 2', () => {
      expect(getLineSize({ strokeWidth: 1 } as LineItem)).toBe('S');
      expect(getLineSize({ strokeWidth: 2 } as LineItem)).toBe('S');
    });

    it('M: strokeWidth ≤ 4', () => {
      expect(getLineSize({ strokeWidth: 3 } as LineItem)).toBe('M');
      expect(getLineSize({ strokeWidth: 4 } as LineItem)).toBe('M');
    });

    it('L: strokeWidth > 4', () => {
      expect(getLineSize({ strokeWidth: 5 } as LineItem)).toBe('L');
      expect(getLineSize({ strokeWidth: 10 } as LineItem)).toBe('L');
    });

    it('경계값 테스트', () => {
      expect(getLineSize({ strokeWidth: 2.1 } as LineItem)).toBe('M');
      expect(getLineSize({ strokeWidth: 4.1 } as LineItem)).toBe('L');
    });
  });

  describe('getTextSize', () => {
    it('S: fontSize ≤ 16', () => {
      expect(getTextSize({ fontSize: 12 } as TextItem)).toBe('S');
      expect(getTextSize({ fontSize: 16 } as TextItem)).toBe('S');
    });

    it('M: fontSize ≤ 32', () => {
      expect(getTextSize({ fontSize: 24 } as TextItem)).toBe('M');
      expect(getTextSize({ fontSize: 32 } as TextItem)).toBe('M');
    });

    it('L: fontSize ≤ 64', () => {
      expect(getTextSize({ fontSize: 48 } as TextItem)).toBe('L');
      expect(getTextSize({ fontSize: 64 } as TextItem)).toBe('L');
    });

    it('XL: fontSize > 64', () => {
      expect(getTextSize({ fontSize: 65 } as TextItem)).toBe('XL');
      expect(getTextSize({ fontSize: 100 } as TextItem)).toBe('XL');
    });

    it('경계값 테스트', () => {
      expect(getTextSize({ fontSize: 17 } as TextItem)).toBe('M');
      expect(getTextSize({ fontSize: 33 } as TextItem)).toBe('L');
    });
  });

  describe('getDrawingSize', () => {
    it('S: strokeWidth ≤ 4', () => {
      expect(getDrawingSize({ strokeWidth: 2 } as DrawingItem)).toBe('S');
      expect(getDrawingSize({ strokeWidth: 4 } as DrawingItem)).toBe('S');
    });

    it('M: strokeWidth ≤ 12', () => {
      expect(getDrawingSize({ strokeWidth: 8 } as DrawingItem)).toBe('M');
      expect(getDrawingSize({ strokeWidth: 12 } as DrawingItem)).toBe('M');
    });

    it('L: strokeWidth > 12', () => {
      expect(getDrawingSize({ strokeWidth: 13 } as DrawingItem)).toBe('L');
      expect(getDrawingSize({ strokeWidth: 20 } as DrawingItem)).toBe('L');
    });

    it('경계값 테스트', () => {
      expect(getDrawingSize({ strokeWidth: 4.1 } as DrawingItem)).toBe('M');
      expect(getDrawingSize({ strokeWidth: 12.1 } as DrawingItem)).toBe('L');
    });
  });

  describe('getItemStyle', () => {
    it('tension === 0이면 straight', () => {
      expect(getItemStyle({ tension: 0 } as ArrowItem)).toBe('straight');
      expect(getItemStyle({ tension: 0 } as LineItem)).toBe('straight');
    });

    it('tension !== 0이면 curved', () => {
      expect(getItemStyle({ tension: 0.5 } as ArrowItem)).toBe('curved');
      expect(getItemStyle({ tension: 1 } as LineItem)).toBe('curved');
      expect(getItemStyle({ tension: 0.01 } as ArrowItem)).toBe('curved');
      expect(getItemStyle({ tension: -0.5 } as ArrowItem)).toBe('curved');
    });
  });
});
