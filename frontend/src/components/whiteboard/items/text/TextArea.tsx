'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';

import type { TextItem } from '@/types/whiteboard';

export interface TextAreaProps {
  textId: string;
  textItem: TextItem;
  stageRef: React.RefObject<Konva.Stage | null>;
  onChange: (v: string) => void;
  onClose: () => void;
  onBoundsChange?: (width: number, height: number) => void;
}

export default function TextArea({
  textId,
  textItem,
  stageRef,
  onChange,
  onClose,
  onBoundsChange,
}: TextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const lastBoundsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!stageRef.current) return;

    const textNode = stageRef.current.findOne('#' + textId) as Konva.Text;
    if (!textNode) return;

    textNode.visible(false);
    return () => {
      textNode.visible(true);
      textNode.getLayer()?.batchDraw();
    };
  }, [textId, stageRef]);

  useEffect(() => {
    if (!ref.current || !stageRef.current) return;

    const textNode = stageRef.current.findOne('#' + textId) as Konva.Text;
    if (!textNode) return;

    const textarea = ref.current;
    const stage = textNode.getStage()!;

    // 위치 업데이트 함수
    const updatePosition = () => {
      if (!textarea || !textNode) return;

      const containerRect = stage.container().getBoundingClientRect();
      const m = textNode.getAbsoluteTransform().getMatrix();
      textarea.style.transform = `matrix(${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4] + containerRect.left}, ${m[5] + containerRect.top})`;
    };

    // 초기값 설정
    textarea.value = textNode.text();

    // 핼렬 기반 변환 (위치, 회전, 배율)
    const containerRect = stage.container().getBoundingClientRect();
    const m = textNode.getAbsoluteTransform().getMatrix();
    textarea.style.position = 'absolute';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.transformOrigin = '0 0';
    textarea.style.transform = `matrix(${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4] + containerRect.left}, ${m[5] + containerRect.top})`;

    // 스타일 설정 (Matrix가 배율을 처리하므로 raw 값 사용)
    textarea.style.width = `${textNode.width()}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill() as string;
    textarea.style.caretColor = '#000000';
    textarea.style.backgroundColor = 'transparent';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.boxSizing = 'border-box';
    textarea.style.lineHeight = `${textNode.lineHeight()}`;
    textarea.style.padding = `${textNode.padding()}px`;

    // fontStyle 파싱
    const fontStyle = textNode.fontStyle();
    textarea.style.fontWeight = fontStyle.includes('bold') ? 'bold' : 'normal';
    textarea.style.fontStyle = fontStyle.includes('italic')
      ? 'italic'
      : 'normal';
    textarea.style.textDecoration = textNode.textDecoration();

    // 높이 및 스크롤 제한
    const adjustHeightAndBounds = () => {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      const absScale = textNode.getAbsoluteScale();
      const scaleY = absScale.y;

      // 워크스페이스 화면 기준 Y 위치를 계산해 하단 여백(90px)을 제외 남은 높이 계산
      const screenY = containerRect.top + m[5];
      const maxAvailableScreenHeight = window.innerHeight - screenY - 90;

      // 로컬 스케일로 변환
      const maxAvailableLocalHeight = maxAvailableScreenHeight / scaleY;

      textarea.style.maxHeight = `${maxAvailableLocalHeight}px`;
      textarea.style.overflowY =
        scrollHeight > maxAvailableLocalHeight ? 'auto' : 'hidden';
      textarea.style.height = `${Math.min(scrollHeight, maxAvailableLocalHeight)}px`;

      // 실제 크기 변경 시에만 bounds 업데이트
      if (onBoundsChange) {
        const canvasWidth = textNode.width();
        const canvasHeight = textarea.offsetHeight;

        if (
          Math.abs(canvasWidth - lastBoundsRef.current.width) > 0.1 ||
          Math.abs(canvasHeight - lastBoundsRef.current.height) > 0.1
        ) {
          lastBoundsRef.current = { width: canvasWidth, height: canvasHeight };
          onBoundsChange(canvasWidth, canvasHeight);
        }
      }
    };

    adjustHeightAndBounds();
    textarea.focus();

    // 이벤트 핸들러
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onChange(textarea.value);
        onClose();
      }
    };

    const handleInput = () => {
      adjustHeightAndBounds();
      onChange(textarea.value);
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('aside')) return;
      if (e.target !== textarea) {
        onChange(textarea.value);
        onClose();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);

    // Stage 이벤트 구독 (pan/zoom 시 위치 업데이트)
    stage.on('dragmove', updatePosition);
    stage.on('dragend', updatePosition);
    stage.on('stageTransformChange', updatePosition);

    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('mousedown', handleOutsideClick);
      stage.off('dragmove', updatePosition);
      stage.off('dragend', updatePosition);
      stage.off('stageTransformChange', updatePosition);
    };
  }, [textId, textItem, onChange, onClose, onBoundsChange, stageRef]);

  return (
    <textarea
      ref={ref}
      spellCheck={false}
      className="wrap-break-words scrollbar-hide absolute z-0 m-0 box-border resize-none overflow-hidden border-none bg-transparent p-0 break-all whitespace-pre-wrap outline-none focus:outline-none"
      style={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    />
  );
}
