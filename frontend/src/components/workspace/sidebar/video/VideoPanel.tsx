'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { VideoItem } from '@/types/workspace';
import { extractYoutubeId } from '@/utils/youtube';

import SectionTitle from '../SectionTitle';
import VideoUploadButton from './VideoUploadButton';

export default function VideoPanel() {
  const { cardData, addItem } = useWorkspaceStore();
  const [youtubeInput, setYoutubeInput] = useState('');

  // 아이템 중앙 배치 및 크기 제한
  const createVideoItem = (
    src: string,
    width: number,
    height: number,
    sourceType: 'upload' | 'youtube',
    duration?: number,
  ) => {
    // 중앙 좌표
    const centerX = cardData.workspaceWidth / 2;
    const centerY = cardData.workspaceHeight / 2;

    // 크기 제한(커지는거 방지)
    let displayWidth = width;
    let displayHeight = height;
    const maxSize = 600;

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

    // 아이템 생성
    const newItem: VideoItem = {
      id: uuidv4(),
      type: 'video',
      name: sourceType === 'youtube' ? 'youtube' : 'upload',
      src: src,
      sourceType: sourceType,
      x: centerX - displayWidth / 2,
      y: centerY - displayHeight / 2,
      width: displayWidth,
      height: displayHeight,
      naturalWidth: width,
      naturalHeight: height,
      duration: duration || 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      isLocked: false,
      isVisible: true,
      zIndex: cardData.items.length,
      isAutoPlay: false,
      isLoop: false,
      isMuted: false,
      volume: 1,
    };

    addItem(newItem);
  };

  // 로컬 파일 업로드
  const handleFileUpload = ({
    src,
    width,
    height,
    duration,
  }: {
    src: string;
    width: number;
    height: number;
    duration: number;
  }) => {
    createVideoItem(src, width, height, 'upload', duration);
  };

  // 유튜브 URL 입력
  const handleYoutubeAdd = () => {
    if (!youtubeInput.trim()) return;

    const videoId = extractYoutubeId(youtubeInput);
    if (!videoId) {
      alert('올바르지 않은 유튜브 URL입니다.');
      return;
    }

    // youtube 비디오 아이템 생성(기본 크기 1280x720)
    createVideoItem(videoId, 1280, 720, 'youtube');
    setYoutubeInput('');
  };

  return (
    <div className="scrollbar-thin scrollbar-thumb-neutral-200 h-full w-80 overflow-y-auto bg-white p-5">
      <SectionTitle title="비디오 추가" />

      {/* local upload */}
      <VideoUploadButton onUpload={handleFileUpload} />

      <div className="my-6 border-t border-neutral-100"></div>

      {/* youtube URL */}
      <SectionTitle title="YouTube URL" />
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={youtubeInput}
            onChange={(e) => setYoutubeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleYoutubeAdd()}
            placeholder="https://www.youtube.com/..."
            className="flex-1 rounded border border-neutral-400 px-3 py-2 text-sm text-lime-600 placeholder-neutral-400 focus:border-lime-500 focus:placeholder-lime-500 focus:outline-none"
          />
          <button
            onClick={handleYoutubeAdd}
            className="rounded border-2 border-dashed border-neutral-300 bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-600 transition hover:border-lime-500 hover:bg-lime-200 hover:text-lime-700"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
