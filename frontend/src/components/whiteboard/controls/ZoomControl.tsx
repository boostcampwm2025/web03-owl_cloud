'use client';

import NavButton from '../common/NavButton';
import { ZoomOutIcon, ZoomInIcon } from '@/assets/icons/whiteboard';

export default function ZoomControls() {
  return (
    <div className="absolute right-4 bottom-4 z-50">
      <div className="flex items-center gap-2 rounded bg-neutral-800 p-2">
        <NavButton icon={ZoomOutIcon} label="축소" />

        <div className="flex h-8 w-20 items-center justify-center rounded bg-neutral-700 text-sm text-white">
          <input
            type="number"
            readOnly
            value={1000}
            className="w-9 appearance-none bg-transparent text-right text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span>%</span>
        </div>

        <NavButton icon={ZoomInIcon} label="확대" />
      </div>
    </div>
  );
}
