'use client';

import { ComponentType, SVGProps } from 'react';

interface NavButtonProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  bgColor?: string;
  activeBgColor?: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function NavButton({
  icon: Icon,
  label,
  bgColor,
  activeBgColor,
  isActive,
  onClick,
}: NavButtonProps) {
  const baseBg = bgColor ?? 'bg-neutral-800';
  const hoverBg = bgColor ? `hover:${bgColor}` : 'hover:bg-neutral-700';
  const activeStyle = activeBgColor ?? 'bg-sky-700';

  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        isActive ? activeStyle : `${baseBg} ${hoverBg}`
      }`}
    >
      <Icon
        className="pointer-events-none h-6 w-6 text-neutral-200"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}
