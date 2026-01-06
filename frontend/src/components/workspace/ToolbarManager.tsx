'use client';

import TextToolbar from './TextToolbar';

export default function ToolbarManager() {
  return (
    <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2">
      <TextToolbar />
    </div>
  );
}
