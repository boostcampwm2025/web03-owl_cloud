'use client';

import React from 'react';

interface CardBorderItemProps {
  label: string;
  isSelected?: boolean;
}

export default function CardBorderItem({
  label,
  isSelected,
}: CardBorderItemProps) {
  return (
    <div className="flex cursor-pointer flex-col items-center gap-1 hover:opacity-80">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-neutral-200 transition ${
          isSelected ? 'border-lime-600 bg-white' : 'border-transparent'
        }`}
      >
        {!isSelected && (
          <div className="h-full w-full rounded bg-white opacity-50" />
        )}
      </div>
      <span className="text-lg text-neutral-500">{label}</span>
    </div>
  );
}
