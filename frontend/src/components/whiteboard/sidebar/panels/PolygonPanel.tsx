'use client';

import NavButton from '../../common/NavButton';

import {
  TriangleIcon,
  SquareIcon,
  PentagonIcon,
} from '@/assets/icons/whiteboard';

export default function PolygonPanel() {
  return (
    <div className="flex flex-col gap-2">
      <NavButton icon={TriangleIcon} label="삼각형" />
      <NavButton icon={SquareIcon} label="사각형" />
      <NavButton icon={PentagonIcon} label="오각형" />
    </div>
  );
}
