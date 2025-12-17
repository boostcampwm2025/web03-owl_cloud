'use client';

import AddReactionIcon from '@/components/card/AddReactionIcon';
import { useState } from 'react';

export default function AddReactionBtn({ cardId }: { cardId: string }) {
  const [isActive, setIsActive] = useState(false);
  const onClick = () => {
    // 전역 변수로 cardId인 Card에 전달

    setIsActive((prev) => !prev);
  };

  return (
    <button
      onClick={onClick}
      className={`btn-sm ${isActive ? 'btn-active' : 'btn-default'}`}
    >
      <AddReactionIcon />
      <span>반응 추가</span>
    </button>
  );
}
