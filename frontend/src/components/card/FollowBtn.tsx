'use client';

import { useCardDetailStore } from '@/store/useCardDetailStore';
import { useState } from 'react';

export default function FollowBtn({ hasFollowed }: { hasFollowed: boolean }) {
  const { cardData } = useCardDetailStore();
  const { id } = cardData;

  const [isFollowing, setIsFollowing] = useState(hasFollowed);
  const onFollowClick = () => {
    // cardId로 팔로우 API 호출

    setIsFollowing((prev) => !prev);
  };

  return (
    <button
      onClick={onFollowClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold ${isFollowing ? 'bg-neutral-200 text-neutral-600' : 'bg-lime-500 text-white'}`}
    >
      {isFollowing ? '언팔로우' : '팔로우'}
    </button>
  );
}
