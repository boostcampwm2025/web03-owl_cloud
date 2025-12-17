'use client';

import React from 'react';

interface CardColorButtonProps {
  color: string;
  isActive: boolean;
  onClick: () => void;
}

export default function CardColorButton({
  color,
  isActive,
  onClick,
}: CardColorButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`h-8 w-8 rounded-full border transition hover:scale-120 ${
        isActive ? 'ring-2 ring-lime-500 ring-offset-1' : 'border-gray-200'
      }`}
      style={{ backgroundColor: color }}
    />
  );
}
