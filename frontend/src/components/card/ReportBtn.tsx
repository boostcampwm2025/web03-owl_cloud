'use client';

import { useCardDetailStore } from '@/store/useCardDetailStore';
import Image from 'next/image';

export default function ReportBtn() {
  const { cardData } = useCardDetailStore();
  const { id } = cardData;

  const onReportClick = () => {
    // cardId로 신고 API 호출
  };

  return (
    <button
      onClick={onReportClick}
      className="btn-sm text-red-600 hover:bg-neutral-100"
    >
      <Image
        src="/icons/card/reportIcon.svg"
        width={24}
        height={24}
        alt="신고 아이콘"
      />
      <span>신고</span>
    </button>
  );
}
