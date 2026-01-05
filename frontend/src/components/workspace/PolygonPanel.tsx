'use client';

import NavButton from './NavButton';

import { TriangleIcon, SquareIcon, PentagonIcon } from '@/assets/icons/editor';

export default function PolygonPanel() {
  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={TriangleIcon} label="삼각형" />
      <NavButton icon={SquareIcon} label="사각형" />
      <NavButton icon={PentagonIcon} label="오각형" />
    </div>
  );
}
