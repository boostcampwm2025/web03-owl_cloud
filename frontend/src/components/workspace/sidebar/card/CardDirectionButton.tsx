'use client';

import React from 'react';

interface CardDirectionButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function CardDirectionButton({
  label,
  isActive,
  onClick,
}: CardDirectionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md border py-2 text-lg transition ${
        isActive
          ? 'border-0 bg-lime-100 text-lime-600'
          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
      }`}
    >
      {label}
    </button>
  );
}
