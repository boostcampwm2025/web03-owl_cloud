import HistoryControl from '@/components/workspace/HistoryControl';
import OverlayControl from '@/components/workspace/OverlayControl';
import Sidebar from '@/components/workspace/Sidebar';
import ToolbarManager from '@/components/workspace/ToolbarManager';
import ZoomControls from '@/components/workspace/ZoomControl';

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <ToolbarManager />
      <Sidebar />
      <HistoryControl />
      <ZoomControls />
      <OverlayControl />
    </div>
  );
}
