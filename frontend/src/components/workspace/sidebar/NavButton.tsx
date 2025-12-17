'use client';

import React from 'react';

// Sidebar Button에 사용되는 Props 인터페이스
interface NavButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// Sidebar Button 컴포넌트
export default function NavButton({
  icon,
  label,
  isActive,
  onClick,
}: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col items-center justify-center gap-1 py-4 transition ${
        isActive
          ? 'text-lime-600'
          : 'text-neutral-500 hover:bg-lime-50 hover:text-neutral-900'
      }`}
    >
      {/* NavButton Icon 부분 */}
      <div className="relative h-12 w-12">
        <div
          className={`h-full w-full transition-colors duration-200 ${
            isActive
              ? 'bg-lime-600'
              : 'bg-neutral-500 group-hover:bg-neutral-900'
          }`}
          style={{
            maskImage: `url(${icon})`,
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',

            // Cross-browsing 막기 위한 Webkit 접두사
            WebkitMaskImage: `url(${icon})`,
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            WebkitMaskSize: 'contain',
          }}
        />
      </div>

      {/* NavButton Label 부분 */}
      <span className="text-lg">{label}</span>
    </button>
  );
}
