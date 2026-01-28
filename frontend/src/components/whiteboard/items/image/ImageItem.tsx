'use client';

import { useState } from 'react';

import Konva from 'konva';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

import { ImageItem as ImageItemType } from '@/types/whiteboard';
import { useItemAnimation } from '@/hooks/useItemAnimation';

interface ImageItemProps {
  imageItem: ImageItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<ImageItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function ImageItem({
  imageItem,
  isDraggable,
  isListening,
  isSelected,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: ImageItemProps) {
  // useImage(item.src, 'anonymous'); : CORS 문제 방지
  // 추후 AWS S3,외부 이미지 서버에 있는 이미지 URL 불러올때 문제 생길 수 있음(현재는 로컬에서 올려서 문제 X)
  // anonymous 옵션이 없다면 캔버스를 이미지로 저장할때(state.toDataURL()) 시에 보안 에러 발생 가능성 있음

  // imageBitmap : use-image 훅에서 반환하는 이미지 객체(image 태그를 JS로 만든거 new window.Image()와 동일)
  // KonvaImage는 src 직접 이해 불가해서 useImage 훅 사용
  // 동작 원리
  // useImage : imageItem.src 를 읽음
  // 비동기적으로 이미지를 다운로드하거나 디코딩함
  // 로딩 완료시 imageBitmap변수에 이미지 객체를 담고 컴포넌트 렌더링 시 화면에 표시
  const [imageBitmap] = useImage(imageItem.src, 'anonymous');
  const [isDragging, setIsDragging] = useState(false);

  // 애니메이션 훅
  const imageRef = useItemAnimation({
    x: imageItem.x,
    y: imageItem.y,
    width: imageItem.width,
    height: imageItem.height,
    isSelected,
    isDragging,
  });

  const commonProps = {
    ref: imageRef as React.RefObject<Konva.Image>,
    id: imageItem.id,

    // 비트맵 연결
    image: imageBitmap,

    // 위치
    x: imageItem.x,
    y: imageItem.y,

    // 크기
    width: imageItem.width,
    height: imageItem.height,

    // 회전
    rotation: imageItem.rotation,

    // 테두리 속성
    stroke: imageItem.stroke,
    strokeWidth: imageItem.strokeWidth,
    cornerRadius: imageItem.cornerRadius,

    // 투명도
    opacity: imageItem.opacity,

    // 테두리 스타일
    dash: imageItem.dash,

    draggable: isDraggable,
    listening: isListening,
    onMouseDown: onSelect,
    onTouchStart: onSelect,
    onMouseEnter: onMouseEnter,
    onMouseLeave: onMouseLeave,
    onDragStart: () => {
      setIsDragging(true);
      onDragStart?.();
    },

    // 이동
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false);
      onChange({ x: e.target.x(), y: e.target.y() });
      onDragEnd?.();
    },

    // 크기 조절 및 회전
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // 크기 보정
      node.scaleX(1);
      node.scaleY(1);

      // 실제 크기 계산(너비 / 높이)
      const newWidth = Math.max(5, node.width() * scaleX);
      const newHeight = Math.max(5, node.height() * scaleY);

      onChange({
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });
    },
  };

  return <KonvaImage {...commonProps} />;
}
