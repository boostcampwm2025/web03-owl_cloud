'use client';

import { useState } from 'react';

export default function ToggleReactionBtn() {
  const [isActive, setIsActive] = useState(true);
  const onToggleClick = () => {
    // 전역 변수로 Card에 전달

    setIsActive((prev) => !prev);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-neutral-600">반응 보기</span>
      <button
        onClick={onToggleClick}
        className={`flex w-12 rounded-full p-1 ${isActive ? 'justify-end bg-lime-500' : 'bg-neutral-200'}`}
      >
        <div className="h-5 w-5 rounded-full bg-white shadow-md" />
      </button>
    </div>
  );
}
