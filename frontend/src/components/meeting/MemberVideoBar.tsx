'use client';

import { DUMMY_DATA } from '@/app/[meetingId]/dummy';
import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons/common';
import SmVideo from '@/components/meeting/SmVideo';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useEffect, useState } from 'react';

export default function MemberVideoBar() {
  // 이후 WebRTC로 수정 필요
  const { lastPage, membersPerPage, totalMemberCount, members } = DUMMY_DATA;

  const { setMembers } = useMeetingStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasPrevPage, hasNextPage] = [currentPage > 1, currentPage < lastPage];

  useEffect(() => {
    setMembers(totalMemberCount);
  }, [setMembers, totalMemberCount]);

  const onPrevClick = () => {
    if (!hasPrevPage) return;
    setCurrentPage((prev) => prev - 1);
  };

  const onNextClick = () => {
    if (!hasNextPage) return;
    setCurrentPage((prev) => prev + 1);
  };

  // (프로토타입용) 이후 WebRTC나 API 호출 시 불필요
  const start = (currentPage - 1) * membersPerPage;
  const end = (currentPage - 1) * membersPerPage + membersPerPage;

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
        {members.slice(start, end).map((member) => (
          <SmVideo key={member.id} {...member} />
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
