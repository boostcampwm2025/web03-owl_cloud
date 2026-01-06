'use client';

import NavButton from '@/components/whiteboard/common/NavButton';

import { TextBoxIcon } from '@/assets/icons/whiteboard';

export default function TextPanel() {
  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={TextBoxIcon} label="텍스트" />
    </div>
  );
}
