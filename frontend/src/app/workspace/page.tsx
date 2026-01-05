import HistoryControl from '@/components/workspace/ui/HistoryControl';
import OverlayControl from '@/components/workspace/ui/OverlayControl';
import Sidebar from '@/components/workspace/ui/Sidebar';
import ToolbarManager from '@/components/workspace/ui/ToolbarManager';
import ZoomControls from '@/components/workspace/ui/ZoomControl';

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
