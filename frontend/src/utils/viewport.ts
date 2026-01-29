import type Konva from 'konva';
import type { WhiteboardItem } from '@/types/whiteboard';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 보이는 영역 계산
export function getViewportRect(stage: Konva.Stage): Rect {
  const scale = stage.scaleX();
  const pos = stage.position();

  return {
    x: -pos.x / scale,
    y: -pos.y / scale,
    width: stage.width() / scale,
    height: stage.height() / scale,
  };
}

// 교차하는지
export function isIntersecting(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

//아이템 박스 계산
export function getItemBoundingBox(item: WhiteboardItem): Rect {
  switch (item.type) {
    case 'shape':
    case 'image':
    case 'video':
    case 'youtube':
      return {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      };

    // 텍스트는 크게 잡음
    case 'text': {
      const SAFE_WIDTH = Math.max(item.width * 3, 3000);
      const SAFE_HEIGHT = Math.max(
        item.fontSize * (item.text?.split('\n').length || 1) * 3,
        2000,
      );

      return {
        x: item.x - SAFE_WIDTH / 2,
        y: item.y - SAFE_HEIGHT / 2,
        width: SAFE_WIDTH,
        height: SAFE_HEIGHT,
      };
    }

    case 'arrow':
    case 'line':
    case 'drawing': {
      const points = item.points;
      if (!points || points.length < 2) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }

      const padding = (item.strokeWidth || 2) * 2;

      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      };
    }

    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

export function filterVisibleItems(
  items: WhiteboardItem[],
  viewport: Rect,
): WhiteboardItem[] {
  return items.filter((item) => {
    const bbox = getItemBoundingBox(item);
    return isIntersecting(bbox, viewport);
  });
}
