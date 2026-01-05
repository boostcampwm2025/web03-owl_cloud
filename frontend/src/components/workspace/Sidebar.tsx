'use client';

import { useState } from 'react';

import NavButton from './NavButton';
import TextPanel from './TextPanel';
import MediaPanel from './MediaPanel';
import PolygonPanel from './PolygonPanel';
import { ImageIcon } from '@/assets/icons/common';
import {
  CursorIcon,
  PenIcon,
  EraserIcon,
  PentagonIcon,
  TextBoxIcon,
} from '@/assets/icons/editor';

type TabType = 'move' | 'draw' | 'eraser' | 'text' | 'polygon' | 'media' | null;

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [panelTop, setPanelTop] = useState<number | null>(null);

  const handleTabClick = (
    tab: TabType,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    //상세 패널 위치 계산
    const centerY =
      e.currentTarget.offsetTop + e.currentTarget.offsetHeight / 2;

    setActiveTab((prev) => (prev === tab ? null : tab));
    setPanelTop(centerY);
  };

  return (
    <aside className="fixed top-1/2 left-4 z-50 flex -translate-y-1/2 items-start">
      <div className="relative flex flex-col items-center gap-2 rounded bg-neutral-800 p-2">
        {/* 메인 패널 */}
        <NavButton
          icon={CursorIcon}
          label="움직이기"
          isActive={activeTab === 'move'}
        />
        <NavButton
          icon={PenIcon}
          label="자유 그리기"
          isActive={activeTab === 'draw'}
        />
        <NavButton
          icon={EraserIcon}
          label="지우개"
          isActive={activeTab === 'eraser'}
        />

        <div className="h-px w-8 bg-neutral-200" />

        <NavButton
          icon={PentagonIcon}
          label="도형"
          activeBgColor="bg-neutral-700"
          isActive={activeTab === 'polygon'}
          onClick={(e) => handleTabClick('polygon', e)}
        />
        <NavButton
          icon={TextBoxIcon}
          label="텍스트"
          activeBgColor="bg-neutral-700"
          isActive={activeTab === 'text'}
          onClick={(e) => handleTabClick('text', e)}
        />
        <NavButton
          icon={ImageIcon}
          label="미디어"
          activeBgColor="bg-neutral-700"
          isActive={activeTab === 'media'}
          onClick={(e) => handleTabClick('media', e)}
        />

        {/* 상세 패널 */}
        {activeTab && panelTop !== null && (
          <div
            className="absolute left-full ml-2 w-12 -translate-y-1/2 rounded bg-neutral-800 p-2"
            style={{ top: panelTop }}
          >
            {activeTab === 'text' && <TextPanel />}
            {activeTab === 'polygon' && <PolygonPanel />}
            {activeTab === 'media' && <MediaPanel />}
          </div>
        )}
      </div>
    </aside>
  );
}
