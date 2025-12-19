'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ImageItem } from '@/types/workspace';

import SectionTitle from '../SectionTitle';
import UploadButton from './UploadButton';

export default function ImagePanel() {
  const { cardData, addItem } = useWorkspaceStore();

  // 이미지 업로드 핸들러
  const handleUpload = ({
    src,
    width,
    height,
  }: {
    src: string;
    width: number;
    height: number;
  }) => {
    // 맨처음 이미지 중앙 배치
    const centerX = cardData.workspaceWidth / 2;
    const centerY = cardData.workspaceHeight / 2;

    // 이미지 클 경우 600px 제한
    let displayWidth = width;
    let displayHeight = height;
    const maxSize = 600;

    // 크기 제한 : 비율 유지 (찌그러짐 방지용)
    if (width > maxSize || height > maxSize) {
      const ratio = width / height;
      if (width > height) {
        displayWidth = maxSize;
        displayHeight = maxSize / ratio;
      } else {
        displayHeight = maxSize;
        displayWidth = maxSize * ratio;
      }
    }

    const newItem: ImageItem = {
      id: uuidv4(),
      type: 'image',
      name: 'Uploaded Image',
      src: src,
      x: centerX - displayWidth / 2,
      y: centerY - displayHeight / 2,
      width: displayWidth,
      height: displayHeight,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      isLocked: false,
      isVisible: true,
      zIndex: cardData.items.length,
      naturalWidth: width,
      naturalHeight: height,
    };

    addItem(newItem);
  };

  return (
    <div className="scrollbar-thin scrollbar-thumb-neutral-200 h-full w-80 overflow-y-auto bg-white p-5">
      <SectionTitle title="이미지 추가" />
      <UploadButton onUpload={handleUpload} />
    </div>
  );
}
