'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import type { ShapeItem } from '@/types/whiteboard';

export interface ShapeTextAreaProps {
  shapeId: string;
  shapeItem: ShapeItem;
  stageRef: React.RefObject<Konva.Stage | null>;
  onChange: (text: string) => void;
  onClose: () => void;
  onSizeChange?: (
    width: number,
    height: number,
    newY?: number,
    newX?: number,
    text?: string,
  ) => void;
}

export default function ShapeTextArea({
  shapeId,
  shapeItem,
  stageRef,
  onChange,
  onClose,
  onSizeChange,
}: ShapeTextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);
  const lastSentHeightRef = useRef(shapeItem.height);
  const lastSentTextRef = useRef(shapeItem.text || '');

  // 초기 값 설정
  useEffect(() => {
    if (ref.current && !initializedRef.current) {
      ref.current.value = shapeItem.text || '';
      lastSentTextRef.current = shapeItem.text || '';
    }
  }, [shapeItem.text]);

  // 입력 중일 때 텍스트 노드 숨김
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const shapeGroup = stage.findOne('#' + shapeId) as Konva.Group;
    if (!shapeGroup) return;

    const textNode = shapeGroup.findOne('Text') as Konva.Text;
    if (textNode) {
      textNode.visible(false);
      textNode.getLayer()?.batchDraw();
    }

    return () => {
      const currentGroup = stage.findOne('#' + shapeId) as Konva.Group;
      if (currentGroup) {
        const currentTextNode = currentGroup.findOne('Text') as Konva.Text;
        if (currentTextNode) {
          currentTextNode.visible(true);
          currentTextNode.getLayer()?.batchDraw();
        }
      }
    };
  }, [shapeId, stageRef, shapeItem.text]);

  // 렌더링에 필요한 스타일
  const {
    width: shapeWidth,
    height: shapeHeight,
    rotation: shapeRotation,
    fontSize: shapeFontSize,
    fontFamily: shapeFontFamily,
    fontStyle: shapeFontStyle,
    textColor: shapeTextColor,
    textAlign: shapeTextAlign,
    textDecoration: shapeTextDecoration,
  } = shapeItem;

  // Konva 절대 변환 행렬(getAbsoluteTransform) 기반 위치 계산
  useEffect(() => {
    if (!ref.current || !stageRef.current) return;

    const textarea = ref.current;
    const stage = stageRef.current;
    const shapeGroup = stage.findOne('#' + shapeId) as Konva.Group;
    if (!shapeGroup) return;

    const textNode = shapeGroup.findOne('Text') as Konva.Text | undefined;

    // 위치 업데이트
    const updatePosition = () => {
      if (!textarea || !shapeGroup) return;

      const containerRect = stage.container().getBoundingClientRect();
      const transform = textNode
        ? textNode.getAbsoluteTransform().copy()
        : shapeGroup.getAbsoluteTransform().copy();

      if (!textNode) {
        const expectedWidth = shapeWidth * 0.8;
        const offsetX = (shapeWidth - expectedWidth) / 2;
        transform.translate(offsetX, 0);
      }

      const m = transform.getMatrix();
      textarea.style.transform = `matrix(${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4] + containerRect.left}, ${m[5] + containerRect.top})`;
    };

    const containerRect = stage.container().getBoundingClientRect();

    // 텍스트 노드가 있으면 해당 transform 사용, 없으면 도형 기준 transform 계산
    const transform = textNode
      ? textNode.getAbsoluteTransform().copy()
      : shapeGroup.getAbsoluteTransform().copy();

    let textWidth: number;
    let textPadding: number;

    if (textNode) {
      textWidth = textNode.width();
      textPadding = textNode.padding();
    } else {
      const expectedWidth = shapeWidth * 0.8;
      const offsetX = (shapeWidth - expectedWidth) / 2;
      transform.translate(offsetX, 0);
      textWidth = expectedWidth;
      textPadding = 4;
    }

    const m = transform.getMatrix();

    textarea.style.position = 'absolute';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.transformOrigin = '0 0';
    textarea.style.transform = `matrix(${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4] + containerRect.left}, ${m[5] + containerRect.top})`;
    textarea.style.zIndex = '0';

    // 스타일 설정
    const fontSize = shapeFontSize || 16;
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.fontFamily = shapeFontFamily || 'Arial';
    textarea.style.color = shapeTextColor || '#000000';
    textarea.style.width = `${textWidth}px`;
    textarea.style.textAlign = shapeTextAlign || 'center';

    const fontStyle = shapeFontStyle || 'normal';
    textarea.style.fontWeight = fontStyle.includes('bold') ? 'bold' : 'normal';
    textarea.style.fontStyle = fontStyle.includes('italic')
      ? 'italic'
      : 'normal';
    textarea.style.textDecoration = shapeTextDecoration || 'none';

    textarea.style.backgroundColor = 'transparent';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.boxSizing = 'border-box';
    textarea.style.lineHeight = '1.2';
    textarea.style.padding = `${textPadding}px`;

    const adjustHeight = (isInitial: boolean = false) => {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      const absScale = (textNode || shapeGroup).getAbsoluteScale();
      const scaleY = absScale.y;

      const screenY = containerRect.top + m[5];
      const maxAvailableScreenHeight = window.innerHeight - screenY - 90;
      const maxAvailableLocalHeight = maxAvailableScreenHeight / scaleY;

      textarea.style.maxHeight = `${maxAvailableLocalHeight}px`;
      textarea.style.overflowY =
        scrollHeight > maxAvailableLocalHeight ? 'auto' : 'hidden';
      textarea.style.height = `${Math.min(scrollHeight, maxAvailableLocalHeight)}px`;

      //텍스트 변경 또는 높이 증가가 필요할 때만 도형 크기 및 텍스트 동기화
      if (onSizeChange && !isInitial) {
        const newShapeHeight = Math.max(
          shapeHeight,
          (textarea.scrollHeight + 20) / 1, // 로컬 스케일 기준이므로 1로 나눔
        );

        const threshold = 1;
        const heightChanged =
          Math.abs(newShapeHeight - lastSentHeightRef.current) > threshold;
        const textChanged = textarea.value !== lastSentTextRef.current;

        if (heightChanged || textChanged) {
          lastSentHeightRef.current = newShapeHeight;
          lastSentTextRef.current = textarea.value;
          onSizeChange(
            shapeWidth,
            newShapeHeight,
            undefined,
            undefined,
            textarea.value,
          );
        }
      }
    };

    const onInput = () => adjustHeight(false);
    textarea.addEventListener('input', onInput);
    adjustHeight(true);

    if (!initializedRef.current) {
      initializedRef.current = true;
      textarea.focus();
    }

    // Stage 이벤트 구독
    stage.on('dragmove', updatePosition);
    stage.on('dragend', updatePosition);
    stage.on('stageTransformChange', updatePosition);

    return () => {
      textarea.removeEventListener('input', onInput);
      stage.off('dragmove', updatePosition);
      stage.off('dragend', updatePosition);
      stage.off('stageTransformChange', updatePosition);
    };
  }, [
    shapeId,
    shapeWidth,
    shapeHeight,
    shapeRotation,
    shapeFontSize,
    shapeFontFamily,
    shapeFontStyle,
    shapeTextColor,
    shapeTextAlign,
    shapeTextDecoration,
    shapeItem.text,
    stageRef,
    onSizeChange,
    onChange,
    onClose,
  ]);

  // 외부 클릭 시 텍스트 편집 종료하고 최종 크기/위치 반영
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 사이드바 클릭은 무시 (편집 유지)
      if (target.closest('aside')) return;

      if (ref.current && e.target !== ref.current) {
        const textarea = ref.current;
        const currentText = textarea.value;

        if (onSizeChange) {
          const stage = stageRef.current;
          if (stage) {
            // 텍스트 높이에 맞춰 도형의 최소 높이 계산
            const newHeight = Math.max(
              shapeItem.height,
              textarea.scrollHeight + 20,
            );

            // 높이 증가 시 도형 중심 유지하기 위한 위치 보정
            const heightDiff = newHeight - shapeItem.height;
            const rotation = stage.findOne('#' + shapeId)?.rotation() || 0;

            const dyLocal = -heightDiff / 2;
            const rad = (rotation * Math.PI) / 180;
            const dxGlobal = -dyLocal * Math.sin(rad);
            const dyGlobal = dyLocal * Math.cos(rad);

            // 최종 크기, 위치, 텍스트 동기화
            onSizeChange(
              shapeItem.width,
              newHeight,
              shapeItem.y + dyGlobal,
              shapeItem.x + dxGlobal,
              currentText,
            );
          }
        } else {
          // 크기 변경이 없는 경우 텍스트만 반영
          onChange(currentText);
        }
        onClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onChange, onClose, onSizeChange, shapeId, shapeItem, stageRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onChange(ref.current?.value || '');
      onClose();
    }
  };

  return (
    <textarea
      ref={ref}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      className="scrollbar-hide absolute z-0 m-0 box-border resize-none overflow-hidden border-none bg-transparent p-0 break-all whitespace-pre-wrap outline-none focus:outline-none"
      style={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    />
  );
}
