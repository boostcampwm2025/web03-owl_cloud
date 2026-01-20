'use client';

import dynamic from 'next/dynamic';

import HistoryControl from '@/components/whiteboard/controls/HistoryControl';
import OverlayControl from '@/components/whiteboard/controls/OverlayControl';
import ZoomControls from '@/components/whiteboard/controls/ZoomControl';
import Sidebar from '@/components/whiteboard/sidebar/Sidebar';
import ToolbarContainer from '@/components/whiteboard/toolbar/ToolbarContainer';

const Canvas = dynamic(() => import('@/components/whiteboard/Canvas'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function Home() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <ToolbarContainer />
      <Sidebar />
      <HistoryControl />
      <ZoomControls />
      <OverlayControl />
      <Canvas />
    </div>
  );
}
