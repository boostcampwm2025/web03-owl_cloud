'use client';

import { Line } from 'react-konva';
import type { ArrowHeadType } from '@/types/whiteboard';

interface CustomArrowHeadProps {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  stroke: string;
  strokeWidth: number;
  type: ArrowHeadType;
  chevronSpacing?: number;
}

export default function CustomArrowHead({
  x,
  y,
  angle,
  length,
  width,
  stroke,
  strokeWidth,
  type,
  chevronSpacing = 0.8,
}: CustomArrowHeadProps) {
  if (type === 'none') {
    return null;
  }

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  if (type === 'triangle') {
    // ▷ 삼각형
    const points = [
      x,
      y, // 끝점
      x - length * cos + (width / 2) * sin,
      y - length * sin - (width / 2) * cos,
      x - length * cos - (width / 2) * sin,
      y - length * sin + (width / 2) * cos,
    ];

    return (
      <Line
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  if (type === 'chevron') {
    // > 쉐브론 (V자)
    const points = [
      x - length * cos + (width / 2) * sin,
      y - length * sin - (width / 2) * cos,
      x,
      y, // 끝점
      x - length * cos - (width / 2) * sin,
      y - length * sin + (width / 2) * cos,
    ];

    return (
      <Line
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  if (type === 'doubleChevron') {
    // >> 더블 쉐브론
    const spacing = length * chevronSpacing;

    // 앞쪽 쉐브론
    const points1 = [
      x - length * cos + (width / 2) * sin,
      y - length * sin - (width / 2) * cos,
      x,
      y,
      x - length * cos - (width / 2) * sin,
      y - length * sin + (width / 2) * cos,
    ];

    // 뒤쪽 쉐브론
    const points2 = [
      x - (length + spacing) * cos + (width / 2) * sin,
      y - (length + spacing) * sin - (width / 2) * cos,
      x - spacing * cos,
      y - spacing * sin,
      x - (length + spacing) * cos - (width / 2) * sin,
      y - (length + spacing) * sin + (width / 2) * cos,
    ];

    return (
      <>
        <Line
          points={points1}
          stroke={stroke}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
        />
        <Line
          points={points2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
        />
      </>
    );
  }

  if (type === 'line') {
    // | 수직선
    const points = [
      x + (width / 2) * sin,
      y - (width / 2) * cos,
      x - (width / 2) * sin,
      y + (width / 2) * cos,
    ];

    return (
      <Line
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        lineCap="round"
      />
    );
  }

  return null;
}
