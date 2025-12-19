'use client';

import AddReactionIcon from '@/components/card/AddReactionIcon';
import { useCardDetailStore } from '@/store/useCardDetailStore';

export default function AddReactionBtn() {
  const { addingReaction, setAddingReaction } = useCardDetailStore();

  const onClick = () => {
    setAddingReaction(!addingReaction);
  };

  return (
    <button
      onClick={onClick}
      className={`btn-sm ${addingReaction ? 'btn-active' : 'btn-default'}`}
    >
      <AddReactionIcon />
      <span>반응 추가</span>
    </button>
  );
}
