'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import Sidebar from '@/components/workspace/Sidebar';

// Konva Stage : 브라우저 API(window)를 사용 -> ssr: false 설정 필수
const WorkspaceStage = dynamic(
  () => import('@/components/workspace/WorkspaceStage'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] w-[800px] items-center justify-center bg-white text-gray-400">
        {/* spinner 구현 */}
        카드제작소 로딩 중...
      </div>
    ),
  },
);

export default function WorkspacePage() {
  const { cardData, zoom } = useWorkspaceStore();

  return (
    <div className="flex h-screen w-full flex-row overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 워크스페이스 영역*/}
        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-gray-200">
          <WorkspaceStage />
        </main>

        {/* 하단 카드 정보 바 */}
        <footer className="flex h-20 items-center justify-end gap-4 border-t border-gray-200 bg-white px-4 text-xl text-black">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>
            W: {cardData.workspaceWidth} x H: {cardData.workspaceHeight}
          </span>
        </footer>
      </div>
    </div>
  );
}
