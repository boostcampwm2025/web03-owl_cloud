'use client';

import { useEffect, useRef, useState } from 'react';
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
  const lastSizeRef = useRef({
    width: shapeItem.width,
    height: shapeItem.height,
  });
  const initializedRef = useRef(false);

  // 텍스트 상태를 컴포넌트 내부에서 관리
  const [text, setText] = useState(shapeItem.text || '');

  // 입력 중일 때 텍스트 노드 숨기기
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const shapeGroup = stage.findOne('#' + shapeId) as Konva.Group;
    if (!shapeGroup) return;

    // Group 내부의 Text 노드 찾아서 숨기기
    const textNode = shapeGroup.findOne('Text') as Konva.Text;
    if (textNode) {
      textNode.visible(false);
    }

    return () => {
      if (textNode) {
        textNode.visible(true);
        textNode.getLayer()?.batchDraw();
      }
    };
  }, [shapeId, stageRef]);

  useEffect(() => {
    // 이미 초기화되었으면 스킵 (크기 변경 시 재실행 방지)
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!ref.current || !stageRef.current) return;

    const textarea = ref.current;
    const stage = stageRef.current;

    // Group 노드를 찾기
    const shapeGroup = stage.findOne('#' + shapeId) as Konva.Group;
    if (!shapeGroup) return;

    // Group의 절대 위치 (화면 좌표)
    const groupPos = shapeGroup.getAbsolutePosition();

    // 원형은 중심점 기준, 나머지는 좌상단 기준
    const isCircle = shapeItem.shapeType === 'circle';

    // 중심점까지의 오프셋 (로컬 좌표)
    const offsetX = isCircle ? 0 : shapeItem.width / 2;
    const offsetY = isCircle ? 0 : shapeItem.height / 2;

    // 회전 적용 (Group의 rotation 사용)
    const rotation = shapeGroup.rotation();
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // 회전된 오프셋 계산
    const rotatedOffsetX = offsetX * cos - offsetY * sin;
    const rotatedOffsetY = offsetX * sin + offsetY * cos;

    // 최종 중심점 위치 (화면 좌표)
    const centerX = groupPos.x + rotatedOffsetX * stage.scaleX();
    const centerY = groupPos.y + rotatedOffsetY * stage.scaleY();

    // Textarea 위치 설정 (중앙 정렬)
    textarea.style.position = 'absolute';
    textarea.style.left = `${centerX}px`;
    textarea.style.top = `${centerY}px`;
    textarea.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    textarea.style.transformOrigin = 'center center';

    // 스타일 설정
    const fontSize = shapeItem.fontSize || 16;
    const lineHeight = 1.2;

    textarea.style.fontSize = `${fontSize * stage.scaleX()}px`;
    textarea.style.fontFamily = shapeItem.fontFamily || 'Arial';
    textarea.style.color = shapeItem.textColor || '#000000';
    textarea.style.background = 'transparent';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';

    // Line Height 계산
    const lineHeightPx = fontSize * lineHeight * stage.scaleX();
    textarea.style.lineHeight = `${lineHeightPx}px`;

    const padding = 4;
    textarea.style.padding = `${padding * stage.scaleX()}px`;

    textarea.style.textAlign = 'center';
    textarea.style.boxSizing = 'border-box';
    textarea.style.zIndex = '1000';

    // 초기 크기 설정
    textarea.style.width = `${shapeItem.width * stage.scaleX() * 0.8}px`;

    // 포커스 및 커서를 맨 끝으로 이동
    textarea.focus();
    const textLength = textarea.value.length;
    textarea.setSelectionRange(textLength, textLength);

    // 높이 조정 및 도형 크기 업데이트
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;

      // 텍스트 크기에 맞춰 도형 높이만 조절 (너비는 고정)
      if (onSizeChange) {
        const newHeight = Math.max(
          shapeItem.height * stage.scaleY(),
          textarea.scrollHeight + 20,
        );

        // 스케일 보정해서 실제 도형 크기로 변환
        const actualHeight = newHeight / stage.scaleY();

        // 크기가 실제로 변경되었을 때만 업데이트
        const threshold = 1;
        if (Math.abs(actualHeight - lastSizeRef.current.height) > threshold) {
          lastSizeRef.current = {
            width: shapeItem.width,
            height: actualHeight,
          };
          onSizeChange(shapeItem.width, actualHeight);
        }
      }
    };

    textarea.addEventListener('input', adjustHeight);
    adjustHeight();

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, []);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Esc: 완료
    if (e.key === 'Escape') {
      e.preventDefault();
      onChange(text);
      onClose();
    }
    // Enter: 줄바꿈 (기본 동작 허용)
  };

  const handleBlur = () => {
    onChange(text);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // 텍스트 변경 시 도형 높이 조절 (너비는 고정)
    if (!ref.current || !stageRef.current || !onSizeChange) {
      onChange(newText);
      return;
    }

    const textarea = ref.current;
    const stage = stageRef.current;

    // 높이 재계산
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    const newHeight = Math.max(
      shapeItem.height * stage.scaleY(),
      textarea.scrollHeight + 20,
    );

    const actualHeight = newHeight / stage.scaleY();

    const threshold = 1;
    if (Math.abs(actualHeight - lastSizeRef.current.height) > threshold) {
      const heightDiff = actualHeight - lastSizeRef.current.height;
      const rotation = stage.findOne('#' + shapeId)?.rotation() || 0;

      let newX = shapeItem.x;
      let newY = shapeItem.y;

      if (shapeItem.shapeType === 'circle') {
        newY = shapeItem.y - heightDiff / 2;
      } else {
        const dyLocal = -heightDiff / 2;
        const rad = (rotation * Math.PI) / 180;

        const dxGlobal = -dyLocal * Math.sin(rad);
        const dyGlobal = dyLocal * Math.cos(rad);

        newX = shapeItem.x + dxGlobal;
        newY = shapeItem.y + dyGlobal;
      }

      lastSizeRef.current = { width: shapeItem.width, height: actualHeight };
      onSizeChange(shapeItem.width, actualHeight, newY, newX, newText);
    } else {
      onChange(newText);
    }
  };

  return (
    <textarea
      ref={ref}
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      spellCheck={false}
      className="absolute z-1000 m-0 box-border resize-none overflow-hidden border-none bg-transparent p-0 break-all whitespace-pre-wrap outline-none focus:outline-none"
    />
  );
}
