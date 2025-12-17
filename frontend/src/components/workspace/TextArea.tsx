'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';

interface TextAreaProps {
  textNode: Konva.Text;
  onChange: (v: string) => void;
  onClose: () => void;
}

export default function TextArea({
  textNode,
  onChange,
  onClose,
}: TextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const textarea = ref.current;

    //textNode와 스타일 동기화
    const stage = textNode.getStage();
    const stageScale = stage ? stage.scaleX() : 1;
    const absPos = textNode.getAbsolutePosition();

    textarea.value = textNode.text();

    textarea.style.position = 'absolute';
    textarea.style.left = `${absPos.x}px`;
    textarea.style.top = `${absPos.y}px`;

    // 크기
    textarea.style.width = `${textNode.width() * stageScale}px`;

    // 폰트 스타일
    textarea.style.fontSize = `${textNode.fontSize() * stageScale}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill() as string;

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

    // 브라우저 기본 스타일 제거
    textarea.style.margin = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.background = 'transparent';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';

    textarea.style.whiteSpace = 'pre-wrap';
    textarea.style.overflowWrap = 'break-word';
    textarea.style.wordBreak = 'break-all';

    // 회전
    textarea.style.transformOrigin = 'left top';
    textarea.style.transform = `rotate(${textNode.rotation()}deg)`;

    // 높이
    textarea.style.height = 'auto';
    textarea.style.height = `${
      textarea.scrollHeight + textNode.fontSize() * stageScale
    }px`;

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
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        onChange(textarea.value);
        onClose();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);

    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick);
    });

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('mousedown', handleOutsideClick);
      clearTimeout(timer);
    };
  }, [textNode, onChange, onClose]);

  return (
    <textarea
      ref={ref}
      className="absolute z-1000 m-0 border-none bg-transparent p-0 focus:outline-none"
      spellCheck={false}
    />
  );
}
