'use client';

import { useState } from 'react';

import NavButton from '@/components/whiteboard/common/NavButton';

import { PanelProps } from '@/types/whiteboard/whiteboardUI';

import { ImageIcon } from '@/assets/icons/common';
import { VideoIcon, YoutubeIcon } from '@/assets/icons/whiteboard';

import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';

export default function MediaPanel({ selectedTool, onSelect }: PanelProps) {
  const { handleAddImage, handleAddVideo, handleAddYoutube } =
    useAddWhiteboardItem();

  // 유튜브 URL 입력창 상태 관리
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const commonProps = {
    bgColor: 'bg-white',
    activeBgColor: 'bg-sky-100 text-sky-600',
  };

  // 유튜브 URL 제출 핸들러
  const handleYoutubeSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!youtubeUrl.trim()) return;

    handleAddYoutube(youtubeUrl);
    setYoutubeUrl('');
    setShowYoutubeInput(false);
  };

  return (
    // 패널 전체 레이아웃 (세로 배치)
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
      {/* 아이콘 버튼 영역 */}
      <div className="flex w-full justify-center gap-1">
        <NavButton
          icon={ImageIcon}
          label="이미지 업로드"
          isActive={selectedTool === 'image'}
          onClick={() => {
            onSelect('image');
            setShowYoutubeInput(false);
            handleAddImage();
          }}
          {...commonProps}
        />
        {/* <NavButton
          icon={VideoIcon}
          label="비디오 업로드"
          isActive={selectedTool === 'video'}
          onClick={() => {
            onSelect('video');
            setShowYoutubeInput(false);
            handleAddVideo();
          }}
          {...commonProps}
        /> */}
        <NavButton
          icon={YoutubeIcon}
          label="유튜브 링크"
          isActive={selectedTool === 'youtube' || showYoutubeInput}
          onClick={(e) => {
            e.stopPropagation();
            setShowYoutubeInput((prev) => !prev);
          }}
          {...commonProps}
        />
      </div>

      {/* 하단 입력창,제출버튼 */}
      {showYoutubeInput && (
        <form
          onSubmit={handleYoutubeSubmit}
          className="flex w-full items-center gap-2 border-t border-neutral-100 p-1 pt-2"
        >
          <input
            type="text"
            placeholder="URL 입력..."
            className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            // 패널이 열릴 때 자동으로 포커스, 클릭 시 닫힘 방지
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <button
            type="submit"
            className="shrink-0 rounded bg-sky-500 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white hover:bg-sky-600 active:bg-sky-600"
            // 클릭시 패널 닫힘 방지
            onClick={(e) => e.stopPropagation()}
          >
            추가
          </button>
        </form>
      )}
    </div>
  );
}
