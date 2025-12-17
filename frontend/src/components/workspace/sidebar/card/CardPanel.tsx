'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

import SectionTitle from '../SectionTitle';
import CardDirectionButton from './CardDirectionButton';
import CardColorButton from './CardColorButton';
import CardBorderItem from './CardBorderItem';

export default function CardPanel() {
  const { cardData, resizeWorkspace, setBackground } = useWorkspaceStore();

  return (
    // TODO : 스크롤 여부 조절 필요(기능이 많아질 경우 : scrollbar 관련 스타일 기능 넣어둠)
    <div className="scrollbar-thin scrollbar-thumb-gray-200 h-full w-80 overflow-y-auto bg-white p-5">
      {/* 카드 방향 설정 */}
      <SectionTitle title="방향" />
      <div className="mb-8 flex gap-2">
        <CardDirectionButton
          label="가로"
          isActive={cardData.workspaceWidth >= cardData.workspaceHeight}
          onClick={() => resizeWorkspace(1200, 700)}
        />
        <CardDirectionButton
          label="세로"
          isActive={cardData.workspaceWidth < cardData.workspaceHeight}
          onClick={() => resizeWorkspace(700, 1200)}
        />
      </div>

      {/* 카드 배경색 설정 : 추후 color-picker 고민 필요(캔버스 느낌) color-picker 기능이 있다면 색상 슬라이드도 추가 필요*/}
      <SectionTitle title="배경색" />
      <div className="mb-8 grid grid-cols-5 gap-3">
        {[
          '#ffffff',
          '#ef4444',
          '#f97316',
          '#facc15',
          '#84cc16',
          '#3b82f6',
          '#a855f7',
          '#ec4899',
          '#14b8a6',
          '#64748b',
        ].map((color) => (
          <CardColorButton
            key={color}
            color={color}
            isActive={cardData.backgroundColor === color}
            onClick={() => setBackground(color)}
          />
        ))}
      </div>

      {/* 카드 테두리 설정 */}
      <SectionTitle title="테두리" />
      <div className="grid grid-cols-3 gap-3">
        <CardBorderItem label="기본" />
      </div>
    </div>
  );
}
