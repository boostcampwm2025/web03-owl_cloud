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
      className={`text-md font-md flex-1 rounded-md border py-2 transition ${
        isActive
          ? 'border-lime-500 bg-[#EBFDB6] text-lime-900'
          : 'border-gray-300 bg-white text-gray-400 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}
