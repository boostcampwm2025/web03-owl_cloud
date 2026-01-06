import HistoryControl from '@/components/workspace/controls/HistoryControl';
import OverlayControl from '@/components/workspace/controls/OverlayControl';
import Sidebar from '@/components/workspace/sidebar/Sidebar';
import ToolbarManager from '@/components/workspace/ToolbarManager';
import ZoomControls from '@/components/workspace/controls/ZoomControl';

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
