'use client';

import { useCardDetailStore } from '@/store/useCardDetailStore';
import Image from 'next/image';
import { useState } from 'react';

interface LikeBtnProps {
  hasLiked: boolean;
  likeCount: number;
}

export default function LikeBtn({ hasLiked, likeCount }: LikeBtnProps) {
  const { cardData } = useCardDetailStore();
  const { id } = cardData;

  const [isLiked, setIsLiked] = useState(hasLiked);
  const [count, setCount] = useState(likeCount);
  const onLikeClick = () => {
    // cardId로 좋아요 API 호출

    setCount((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsLiked((prev) => !prev);
  };

  return (
    <button onClick={onLikeClick} className="flex items-center gap-1">
      {isLiked ? (
        <Image
          src="/icons/card/filledHeartIcon.svg"
          width={32}
          height={32}
          alt="좋아요 버튼 아이콘"
        />
      ) : (
        <Image
          src="/icons/card/emptyHeartIcon.svg"
          width={32}
          height={32}
          alt="좋아요 버튼 아이콘"
        />
      )}
      <span className="font-semibold text-neutral-900">{count}</span>
    </button>
  );
}
