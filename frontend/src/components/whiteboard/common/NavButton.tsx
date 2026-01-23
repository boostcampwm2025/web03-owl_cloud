'use client';

import { ComponentType, SVGProps } from 'react';

interface NavButtonProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  bgColor?: string;
  hvColor?: string;
  activeBgColor?: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function NavButton({
  icon: Icon,
  label,
  bgColor,
  hvColor,
  activeBgColor,
  isActive,
  onClick,
}: NavButtonProps) {
  const baseBg = bgColor ?? 'white';
  const hoverBg = hvColor
    ? `hover:${hvColor}`
    : bgColor
      ? `hover:${bgColor}`
      : 'hover:bg-sky-200';
  const activeStyle = activeBgColor ?? 'bg-sky-200';

  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        isActive ? activeStyle : `${baseBg} ${hoverBg}`
      }`}
    >
      <Icon
        className="pointer-events-none h-6 w-6 text-neutral-600"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}
