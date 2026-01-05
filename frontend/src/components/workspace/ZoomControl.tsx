'use client';

import NavButton from './NavButton';
import { ZoomOutIcon, ZoomInIcon } from '@/assets/icons/editor';

export default function ZoomControls() {
  return (
    <div className="absolute right-4 bottom-4 z-50">
      <div className="flex items-center gap-2 rounded bg-neutral-800 p-2">
        <NavButton icon={ZoomOutIcon} label="축소" />
        <div className="flex h-8 w-20 items-center justify-center rounded bg-neutral-700 text-sm text-white">
          100%
        </div>
        <NavButton icon={ZoomInIcon} label="확대" />
      </div>
    </div>
  );
}
