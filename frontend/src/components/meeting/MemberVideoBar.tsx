'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons/common';
import MyVideo from '@/components/meeting/MyVideo';
import SmVideo from '@/components/meeting/SmVideo';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useState } from 'react';

export default function MemberVideoBar() {
  const { members } = useMeetingStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasPrevPage, hasNextPage] = [
    currentPage > 1,
    currentPage < members.length,
  ];

  const onPrevClick = () => {
    if (!hasPrevPage) return;
    setCurrentPage((prev) => prev - 1);
  };

  const onNextClick = () => {
    if (!hasNextPage) return;
    setCurrentPage((prev) => prev + 1);
  };

  const MEMBERS_PER_PAGE = 6;
  const start = Math.max((currentPage - 1) * MEMBERS_PER_PAGE, 1);
  const end = (currentPage - 1) * MEMBERS_PER_PAGE + MEMBERS_PER_PAGE;

  return (
    <header className="flex w-full justify-between px-4 py-2">
      <button
        className={`h-full rounded-sm ${hasPrevPage ? 'text-neutral-200 hover:bg-neutral-700' : 'cursor-default! text-neutral-700'}`}
        onClick={onPrevClick}
      >
        <ChevronLeftIcon className="h-8 w-8" />
      </button>

      <section className="flex gap-4">
        {/* 이후 백엔드 연동 시 pagination으로 수정, 수동 slice는 불필요 */}
        {start === 1 && <MyVideo />}
        {members.slice(start, end).map((member) => (
          <SmVideo key={member.user_id} {...member} />
        ))}
      </section>

      <button
        className={`h-full rounded-sm ${hasNextPage ? 'text-neutral-200 hover:bg-neutral-700' : 'cursor-default! text-neutral-700'}`}
        onClick={onNextClick}
      >
        <ChevronRightIcon className="h-8 w-8" />
      </button>
    </header>
  );
}
