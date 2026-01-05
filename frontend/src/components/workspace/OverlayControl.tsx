'use client';

import NavButton from './NavButton';
import { ShareIcon, CloseIcon } from '@/assets/icons/common';

export default function OverlayControls() {
  return (
    <div className="absolute top-4 right-4 z-50 flex items-start">
      <div className="flex items-center gap-2 rounded bg-neutral-800 p-2">
        <NavButton icon={ShareIcon} label="share" />
        <NavButton icon={CloseIcon} label="close" bgColor="bg-red-700" />
      </div>
    </div>
  );
}
