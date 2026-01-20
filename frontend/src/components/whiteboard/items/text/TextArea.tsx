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

    //textNode와 스타일 동기화
    const stage = textNode.getStage();
    const stageScale = stage ? stage.scaleX() : 1;
    const absPos = textNode.getAbsolutePosition();

    textarea.value = textNode.text();

    textarea.style.position = 'absolute';

    // 크기
    const nodeWidth = textNode.width() * stageScale;
    const nodeHeight = textNode.height() * stageScale;
    const keepCentered = Boolean(textItem.parentPolygonId);

    const positionTextarea = () => {
      if (keepCentered) {
        const centerX = absPos.x + nodeWidth / 2;
        const centerY = absPos.y + nodeHeight / 2;
        const currentHeight = textarea.offsetHeight;
        textarea.style.left = `${centerX - nodeWidth / 2}px`;
        textarea.style.top = `${centerY - currentHeight / 2}px`;
      } else {
        textarea.style.left = `${absPos.x}px`;
        textarea.style.top = `${absPos.y}px`;
      }
    };

    textarea.style.width = `${nodeWidth}px`;

    // 폰트 스타일
    textarea.style.fontSize = `${textNode.fontSize() * stageScale}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill() as string;
    textarea.style.caretColor = '#000000';

    // Line Height 계산
    const lineHeightPx =
      textNode.fontSize() * textNode.lineHeight() * stageScale;
    textarea.style.lineHeight = `${lineHeightPx}px`;

    // 굵기 및 기울임 파싱 ('normal' | 'italic' | 'bold' | 'bold italic' 기준)
    const fontStyle = textNode.fontStyle();
    textarea.style.fontWeight = fontStyle.includes('bold') ? 'bold' : 'normal';
    textarea.style.fontStyle = fontStyle.includes('italic')
      ? 'italic'
      : 'normal';
    textarea.style.textDecoration = textNode.textDecoration();

    // Padding 동기화 (Konva 패딩 * 스케일)
    const padding = textNode.padding() * stageScale;
    textarea.style.padding = `${padding}px`;

    // 박스 사이징
    textarea.style.boxSizing = 'border-box';

    // 회전
    textarea.style.transformOrigin = 'left top';
    textarea.style.transform = `rotate(${textNode.rotation()}deg)`;

    // 높이
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    positionTextarea();

    const notifyBounds = () => {
      if (!keepCentered || !onBoundsChange) return;

      const canvasWidth = nodeWidth / stageScale;
      const canvasHeight = textarea.offsetHeight / stageScale;

      const hasWidthChanged =
        Math.abs(canvasWidth - lastBoundsRef.current.width) > 0.5;
      const hasHeightChanged =
        Math.abs(canvasHeight - lastBoundsRef.current.height) > 0.5;

      if (!hasWidthChanged && !hasHeightChanged) return;

      lastBoundsRef.current = { width: canvasWidth, height: canvasHeight };
      onBoundsChange(canvasWidth, canvasHeight);
    };

    notifyBounds();

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
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;

      onChange(textarea.value);
      positionTextarea();
      notifyBounds();
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest('aside')) {
        return;
      }

      if (e.target !== textarea) {
        onChange(textarea.value);
        onClose();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);

    // 외부 영역 클릭 시 textarea가 즉시 blur 되면서 onChange가 누락되는 문제가 있어
    // 이벤트 등록 시점을 다음 이벤트 루프로 미룸
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick);
    });

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('mousedown', handleOutsideClick);
      clearTimeout(timer);
    };
  }, [textId, textItem, onChange, onClose, onBoundsChange, stageRef]);

  return (
    <textarea
      ref={ref}
      spellCheck={false}
      className="wrap-break-words absolute z-1000 m-0 box-border resize-none overflow-hidden border-none bg-transparent p-0 break-all whitespace-pre-wrap outline-none focus:outline-none"
    />
  );
}
