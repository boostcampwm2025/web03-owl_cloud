'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons/common';
import MyVideo from '@/components/meeting/MyVideo';
import SmVideo from '@/components/meeting/SmVideo';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useState } from 'react';

export default function MemberVideoBar() {
  const MEMBERS_PER_PAGE = 6;

  const { members } = useMeetingStore();
  const [currentPage, setCurrentPage] = useState(1);
  const memberCount = Object.values(members).length;
  const totalPages =
    memberCount <= 5 ? 1 : 1 + Math.ceil((memberCount - 5) / MEMBERS_PER_PAGE);
  const [hasPrevPage, hasNextPage] = [
    currentPage > 1,
    currentPage < totalPages,
  ];

  const onPrevClick = () => {
    if (!hasPrevPage) return;
    setCurrentPage((prev) => prev - 1);
  };

  const onNextClick = () => {
    if (!hasNextPage) return;
    setCurrentPage((prev) => prev + 1);
  };

  const isFirstPage = currentPage === 1;
  const start = isFirstPage ? 0 : (currentPage - 2) * MEMBERS_PER_PAGE + 5;
  const end = isFirstPage ? 5 : start + MEMBERS_PER_PAGE;

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
        {start === 0 && <MyVideo />}
        {Object.values(members)
          .slice(start, end)
          .map((member) => (
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
