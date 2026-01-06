import HistoryControl from '@/components/whiteboard/controls/HistoryControl';
import OverlayControl from '@/components/whiteboard/controls/OverlayControl';
import ZoomControls from '@/components/whiteboard/controls/ZoomControl';

import Sidebar from '@/components/whiteboard/sidebar/Sidebar';
import ToolbarContainer from '@/components/whiteboard/toolbar/ToolbarContainer';

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <ToolbarContainer />
      <Sidebar />
      <HistoryControl />
      <ZoomControls />
      <OverlayControl />
    </div>
  );
}
