'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';

import { useWhiteboardYjs } from '@/hooks/useWhiteboardYjs';
import { useToolSocketStore } from '@/store/useToolSocketStore';

import HistoryControl from '@/components/whiteboard/controls/HistoryControl';
import OverlayControl from '@/components/whiteboard/controls/OverlayControl';
import ZoomControls from '@/components/whiteboard/controls/ZoomControl';
import Sidebar from '@/components/whiteboard/sidebar/Sidebar';
import ToolbarContainer from '@/components/whiteboard/toolbar/ToolbarContainer';
import RemoteCursors from '@/components/whiteboard/remote/RemoteCursors';

const Canvas = dynamic(() => import('@/components/whiteboard/Canvas'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-neutral-100" />,
});

function Whiteboard() {
  const whiteboardSocket = useToolSocketStore(
    (state) => state.whiteboardSocket,
  );

  useWhiteboardYjs(whiteboardSocket);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-neutral-100">
      <ToolbarContainer />
      <Sidebar />
      <HistoryControl />
      <ZoomControls />
      <OverlayControl />
      <Canvas />
      <RemoteCursors />
    </div>
  );
}

export default memo(Whiteboard);
