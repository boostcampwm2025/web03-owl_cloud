'use client';

import React, { useRef } from 'react';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { ImageItem as ImageItemType } from '@/types/workspace';

interface ImageItemProps {
  item: ImageItemType;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<ImageItemType>) => void;
}

export default function ImageItem({
  item,
  isSelected,
  onSelect,
  onChange,
}: ImageItemProps) {
  // useImage(item.src, 'anonymous'); : CORS 문제 방지
  // 추후 AWS S3,외부 이미지 서버에 있는 이미지 URL 불러올때 문제 생길 수 있음(현재는 로컬에서 올려서 문제 X)
  // anonymous 옵션이 없다면 캔버스를 이미지로 저장할때(state.toDataURL()) 시에 보안 에러 발생 가능성 있음

  // imageBitmap : use-image 훅에서 반환하는 이미지 객체(image 태그를 JS로 만든거 new window.Image()와 동일)
  // KonvaImage는 src 직접 이해 불가해서 useImage 훅 사용
  const [imageBitmap] = useImage(item.src);
  const imageRef = useRef<any>(null);

  // 드래그 종료
  const handleDragEnd = (e: any) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  // 변형(크기,회전) 종료
  const handleTransformEnd = () => {
    const node = imageRef.current;
    if (!node) return;
    onChange({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
  };

  return (
    <KonvaImage
      id={item.id}
      ref={imageRef}
      image={imageBitmap}
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      rotation={item.rotation}
      scaleX={item.scaleX}
      scaleY={item.scaleY}
      opacity={item.opacity}
      draggable={!item.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}
