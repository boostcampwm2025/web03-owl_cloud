'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { TextItem, ImageItem, VideoItem } from '@/types/Workspace';

import NavButton from './sidebar/NavButton';
import CardPanel from './sidebar/card/CardPanel';
import ImagePanel from './sidebar/image/ImagePanel';

type TabType = 'card' | 'text' | 'image' | 'video';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<TabType>('card');
  const [isSaved, setIsSaved] = useState(false);

  const { addItem, resizeWorkspace, setBackground, cardData } =
    useWorkspaceStore();

  const handleSave = () => {
    // 저장 로직 구현
    setIsSaved(true);

    // 2초 뒤 복구
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  // 단축키 감지(ctrl + s / cmd + s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardData]);

  return (
    <aside className="z-1 flex h-full border-r border-neutral-200 bg-white shadow-sm">
      {/* 좌측 네비게이션 */}
      <nav className="flex w-30 flex-col items-center justify-between border-r border-neutral-200 py-4">
        <div className="flex w-full flex-col gap-2">
          <NavButton
            icon="/icons/sidebar/cardIcon.svg"
            label="카드"
            isActive={activeTab === 'card'}
            onClick={() => setActiveTab('card')}
          />
          <NavButton
            icon="/icons/sidebar/textIcon.svg"
            label="텍스트"
            isActive={activeTab === 'text'}
            onClick={() => {
              setActiveTab('text');
            }}
          />
          <NavButton
            icon="/icons/sidebar/imageIcon.svg"
            label="이미지"
            isActive={activeTab === 'image'}
            onClick={() => {
              setActiveTab('image');
            }}
          />
          <NavButton
            icon="/icons/sidebar/videoIcon.svg"
            label="동영상"
            isActive={activeTab === 'video'}
            onClick={() => {
              setActiveTab('video');
            }}
          />
        </div>

        <div className="mb-2 w-full px-2">
          <button
            onClick={handleSave}
            className="group flex w-full flex-col items-center justify-center gap-1 rounded-lg py-2 transition"
          >
            <div
              className={`flex h-15 w-15 items-center justify-center rounded-full transition-all duration-300 ${
                isSaved ? 'bg-lime-600' : 'bg-transparent'
              }`}
            >
              <div
                className={`h-8 w-8 transition-colors duration-200 ${
                  isSaved
                    ? 'bg-white'
                    : 'bg-neutral-400 group-hover:bg-lime-600'
                }`}
                style={{
                  maskImage: `url(/icons/sidebar/checkIcon.svg)`,
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  maskSize: 'contain',
                  WebkitMaskImage: `url(/icons/sidebar/checkIcon.svg)`,
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  WebkitMaskSize: 'contain',
                }}
              />
            </div>

            <span
              className={`text-sm font-semibold transition-colors ${
                isSaved ? 'text-lime-600' : 'text-neutral-500'
              }`}
            >
              {isSaved ? '저장됨' : '완료'}
            </span>
          </button>
        </div>
      </nav>

      {/* 사이드바 상세 패널 */}
      {activeTab === 'card' && <CardPanel />}
      {/* TODO : 상세 패널 추가 */}
      {/* {activeTab === 'text' && <TextPanel />} */}
      {activeTab === 'image' && <ImagePanel />}
      {/* {activeTab === 'video' && <VideoPanel />} */}
    </aside>
  );
}
