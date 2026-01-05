'use client';

import NavButton from './NavButton';
import { ImageIcon } from '@/assets/icons/common';
import { VideoIcon, YoutubeIcon } from '@/assets/icons/editor';

export default function MediaPanel() {
  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={ImageIcon} label="image" />
      <NavButton icon={VideoIcon} label="video" />
      <NavButton icon={YoutubeIcon} label="youtube" />
    </div>
  );
}
