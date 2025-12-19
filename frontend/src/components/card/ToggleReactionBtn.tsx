'use client';

import { useCardDetailStore } from '@/store/useCardDetailStore';

export default function ToggleReactionBtn() {
  const { showingReaction, setShowingReaction } = useCardDetailStore();

  const onToggleClick = () => {
    setShowingReaction(!showingReaction);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-neutral-600">반응 보기</span>
      <button
        onClick={onToggleClick}
        className={`flex w-12 rounded-full p-1 ${showingReaction ? 'justify-end bg-lime-500' : 'bg-neutral-200'}`}
      >
        <div className="h-5 w-5 rounded-full bg-white shadow-md" />
      </button>
    </div>
  );
}
