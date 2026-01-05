'use client';

import NavButton from './NavButton';
import { UndoIcon, RedoIcon } from '@/assets/icons/editor';

export default function HistoryControls() {
  return (
    <div className="absolute bottom-4 left-4 z-50 flex items-start">
      <div className="flex items-center gap-2 rounded bg-neutral-800 p-2">
        <NavButton icon={UndoIcon} label="undo" />
        <NavButton icon={RedoIcon} label="redo" />
      </div>
    </div>
  );
}
