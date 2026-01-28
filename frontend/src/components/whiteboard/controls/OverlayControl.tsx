'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { ShareIcon, CloseIcon } from '@/assets/icons/common';

export default function OverlayControls() {
  return (
    <div className="absolute top-4 right-4 z-1 flex items-start">
      <div className="flex items-center gap-2 rounded border border-neutral-200 bg-white p-2 shadow-sm">
        <NavButton icon={ShareIcon} label="공유" />
        <NavButton icon={CloseIcon} label="화이트보드 닫기" />
      </div>
    </div>
  );
}
