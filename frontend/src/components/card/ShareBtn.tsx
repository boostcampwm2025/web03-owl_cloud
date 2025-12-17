'use client';

import Image from 'next/image';

export default function ShareBtn({ cardId }: { cardId: string }) {
  const onShareClick = () => {
    // cardId로 공유
  };

  return (
    <button onClick={onShareClick} className="btn-sm btn-default">
      <Image
        src="/icons/card/shareIcon.svg"
        width={24}
        height={24}
        alt="공유 아이콘"
      />
      <span>공유</span>
    </button>
  );
}
