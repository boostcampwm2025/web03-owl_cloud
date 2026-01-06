'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { ShareIcon, CloseIcon } from '@/assets/icons/common';

export default function OverlayControls() {
  return (
    <div className="absolute top-4 right-4 z-50 flex items-start">
      <div className="flex items-center gap-2 rounded bg-neutral-800 p-2">
        <NavButton icon={ShareIcon} label="공유" />
        <NavButton icon={CloseIcon} label="닫기" bgColor="bg-red-700" />
      </div>
    </div>
  );
}
