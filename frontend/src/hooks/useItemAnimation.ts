import { useRef, useEffect } from 'react';
import Konva from 'konva';

interface UseItemAnimationProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  isSelected: boolean;
  isDragging: boolean;
}

export function useItemAnimation({
  x,
  y,
  width,
  height,
  isSelected,
  isDragging,
}: UseItemAnimationProps) {
  const nodeRef = useRef<Konva.Node>(null);
  const prevPosRef = useRef({ x, y, width, height });
  const isDraggingRef = useRef(isDragging);
  const isSelectedRef = useRef(isSelected);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    isSelectedRef.current = isSelected;
  }, [isSelected]);

  useEffect(() => {
    if (!nodeRef.current) return;

    const node = nodeRef.current;

    const prevX = prevPosRef.current.x;
    const prevY = prevPosRef.current.y;

    // 위치 변경 확인
    const hasPositionChanged =
      Math.abs(x - prevX) > 0.1 || Math.abs(y - prevY) > 0.1;

    // 크기 변경 확인
    const hasSizeChanged =
      width !== undefined &&
      height !== undefined &&
      prevPosRef.current.width !== undefined &&
      prevPosRef.current.height !== undefined &&
      (Math.abs(width - prevPosRef.current.width) > 0.1 ||
        Math.abs(height - prevPosRef.current.height) > 0.1);

    if (
      (hasPositionChanged || hasSizeChanged) &&
      !isDraggingRef.current &&
      !isSelectedRef.current
    ) {
      // 이전 위치로 설정
      node.x(prevX);
      node.y(prevY);

      // 크기가 있으면 이전 크기로 설정
      if (
        width !== undefined &&
        height !== undefined &&
        prevPosRef.current.width !== undefined &&
        prevPosRef.current.height !== undefined
      ) {
        // Group인 경우 scale 사용, 아니면 width/height 사용
        const isGroup = node.getClassName() === 'Group';

        if (isGroup) {
          // Group은 scale로 크기 조절
          const prevScaleX = prevPosRef.current.width / width;
          const prevScaleY = prevPosRef.current.height / height;

          node.scaleX(prevScaleX);
          node.scaleY(prevScaleY);

          node.to({
            duration: 0.15,
            easing: Konva.Easings.EaseOut,
            x: x,
            y: y,
            scaleX: 1,
            scaleY: 1,
          });
        } else {
          // 일반 노드는 width/height 사용
          node.width(prevPosRef.current.width);
          node.height(prevPosRef.current.height);

          node.to({
            duration: 0.15,
            easing: Konva.Easings.EaseOut,
            x: x,
            y: y,
            width: width,
            height: height,
          });
        }
      } else {
        // 위치만 애니메이션
        node.to({
          duration: 0.15,
          easing: Konva.Easings.EaseOut,
          x: x,
          y: y,
        });
      }
    }

    // 이전 값 업데이트
    prevPosRef.current = { x, y, width, height };
  }, [x, y, width, height]);

  return nodeRef;
}

interface UsePointsAnimationProps {
  points: number[];
  isDragging: boolean;
  isSelected: boolean;
}

export function usePointsAnimation({
  points,
  isDragging,
  isSelected,
}: UsePointsAnimationProps) {
  const nodeRef = useRef<Konva.Node>(null);
  const prevPointsRef = useRef(points);
  const animationRef = useRef<Konva.Tween | null>(null);
  const isSelectedRef = useRef(isSelected);

  useEffect(() => {
    isSelectedRef.current = isSelected;
  }, [isSelected]);

  useEffect(() => {
    if (
      !nodeRef.current ||
      points.length < 2 ||
      isDragging ||
      isSelectedRef.current
    )
      return;

    const node = nodeRef.current;
    const prevPoints = prevPointsRef.current;

    // points 구조가 바뀐 경우 (편집/변형) → 애니메이션 스킵
    if (points.length !== prevPoints.length) {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
      node.x(0);
      node.y(0);
      prevPointsRef.current = points;
      return;
    }

    // 첫 점 기준 이동 오프셋
    if (points.length >= 4 && prevPoints.length >= 4) {
      const dx = points[0] - prevPoints[0];
      const dy = points[1] - prevPoints[1];

      // 이동이 크지 않으면 무시
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        let isUniformMove = true;
        for (let i = 2; i < points.length; i += 2) {
          const currentDx = points[i] - prevPoints[i];
          const currentDy = points[i + 1] - prevPoints[i + 1];
          if (
            Math.abs(currentDx - dx) > 0.1 ||
            Math.abs(currentDy - dy) > 0.1
          ) {
            isUniformMove = false;
            break;
          }
        }

        // 모든 점이 동일한 오프셋으로 이동했는지 확인
        if (isUniformMove) {
          // 진행 중인 애니메이션 중단
          if (animationRef.current) {
            animationRef.current.destroy();
            animationRef.current = null;
          }

          // 현재 위치 (애니메이션 중이면 중간 위치)
          const currentX = node.x();
          const currentY = node.y();

          // 이전 위치로 offset 후 0,0으로 애니메이션
          node.x(currentX - dx);
          node.y(currentY - dy);

          // 0, 0으로 애니메이션 (새 points 위치)
          const tween = new Konva.Tween({
            node: node,
            duration: 0.15,
            easing: Konva.Easings.EaseOut,
            x: 0,
            y: 0,
            onFinish: () => {
              animationRef.current = null;
            },
          });

          animationRef.current = tween;
          tween.play();
        }
      }
    }

    prevPointsRef.current = points;
  }, [points, isDragging]);

  return nodeRef;
}
