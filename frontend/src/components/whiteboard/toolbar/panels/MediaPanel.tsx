'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { PanelProps } from '@/types/whiteboard/whiteboardUI';

import { ImageIcon } from '@/assets/icons/common';
import { VideoIcon, YoutubeIcon } from '@/assets/icons/whiteboard';

import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';

export default function MediaPanel({ selectedTool, onSelect }: PanelProps) {
  const { handleAddImage, handleAddVideo } = useAddWhiteboardItem();

  const commonProps = {
    bgColor: 'bg-white',
    activeBgColor: 'bg-sky-100 text-sky-600',
  };

  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      <NavButton
        icon={ImageIcon}
        label="이미지 업로드"
        isActive={selectedTool === 'image'}
        onClick={() => {
          onSelect('image');
          handleAddImage();
        }}
        {...commonProps}
      />
      <NavButton
        icon={VideoIcon}
        label="비디오 업로드"
        isActive={selectedTool === 'video'}
        onClick={() => {
          onSelect('video');
          handleAddVideo();
        }}
        {...commonProps}
      />
      <NavButton
        icon={YoutubeIcon}
        label="유튜브 링크"
        isActive={selectedTool === 'youtube'}
        onClick={() => onSelect('youtube')}
        {...commonProps}
      />
    </div>
  );
}
