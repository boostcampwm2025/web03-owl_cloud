'use client';

import NavButton from '@/components/whiteboard/common/NavButton';
import { ImageIcon } from '@/assets/icons/common';
import { VideoIcon, YoutubeIcon } from '@/assets/icons/whiteboard';

export default function MediaPanel() {
  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={ImageIcon} label="이미지" />
      <NavButton icon={VideoIcon} label="비디오" />
      <NavButton icon={YoutubeIcon} label="유튜브 링크" />
    </div>
  );
}
