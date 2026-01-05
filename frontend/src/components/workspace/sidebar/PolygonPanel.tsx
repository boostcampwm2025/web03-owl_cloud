'use client';

import NavButton from './NavButton';

import { TriangleIcon, SquareIcon, PentagonIcon } from '@/assets/icons/editor';

export default function PolygonPanel() {
  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={TriangleIcon} label="triangle" />
      <NavButton icon={SquareIcon} label="square" />
      <NavButton icon={PentagonIcon} label="pentagon" />
    </div>
  );
}
