'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons/common';
import MyVideo from '@/components/meeting/MyVideo';
import SmVideo from '@/components/meeting/SmVideo';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useEffect, useMemo, useState } from 'react';

export default function MemberVideoBar() {
  const MEMBERS_PER_PAGE = 6;
  const { members } = useMeetingStore();
  const { consumers } = useMeetingSocketStore();
  const [currentPage, setCurrentPage] = useState(1);

  // 전체 페이지 수 계산 (첫 페이지는 MyVideo 포함)
  const totalPages = useMemo(() => {
    const memberCount = Object.values(members).length;
    if (memberCount <= 5) return 1;
    return 1 + Math.ceil((memberCount - 5) / MEMBERS_PER_PAGE);
  }, [members]);

  // 현재 페이지에 보여야 할 멤버 리스트 계산
  const visibleMembers = useMemo(() => {
    const memberArray = Object.values(members);
    const isFirstPage = currentPage === 1;

    const start = isFirstPage ? 0 : (currentPage - 2) * MEMBERS_PER_PAGE + 5;
    const end = isFirstPage ? 5 : start + MEMBERS_PER_PAGE;

    return memberArray.slice(start, end);
  }, [members, currentPage]);

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  console.log(members);

  // visibleMembers가 바뀔 때 consume, resume/pause
  useEffect(() => {
    const allMembers = Object.values(members);

    // 신규 Consume 대상 추출
    const newVideoConsumers = visibleMembers.reduce((acc, member) => {
      if (member.cam?.provider_id && !consumers[member.user_id]?.video) {
        acc.push(member.cam.provider_id);
      }
      return acc;
    }, [] as string[]);

    // 현재 화면에 보이는 비디오 ID들 (Resume 대상)
    const visibleVideoIds = visibleMembers
      .filter((member) => member.cam?.provider_id)
      .map((member) => member.cam!.provider_id);

    // 다른 페이지의 비디오 ID들 (Pause 대상)
    const hiddenVideoIds = allMembers
      .filter(
        (member) =>
          !visibleMembers.find((vMember) => vMember.user_id === member.user_id),
      )
      .filter((member) => member.cam?.provider_id)
      .map((member) => member.cam!.provider_id);

    console.log('신규 Consume 대상 : ', newVideoConsumers);
    console.log('Resume/Consume 대상(화면 노출) : ', visibleVideoIds);
    console.log('Pause 대상(화면 미노출) : ', hiddenVideoIds);
  }, [visibleMembers, members]);

  const onPrevClick = () => {
    if (!hasPrevPage) return;
    setCurrentPage((prev) => prev - 1);
  };

  const onNextClick = () => {
    if (!hasNextPage) return;
    setCurrentPage((prev) => prev + 1);
  };

  return (
    <header className="flex w-full justify-between px-4 py-2">
      <button
        className={`h-full rounded-sm ${hasPrevPage ? 'text-neutral-200 hover:bg-neutral-700' : 'cursor-default! text-neutral-700'}`}
        onClick={onPrevClick}
      >
        <ChevronLeftIcon className="h-8 w-8" />
      </button>

      <section className="flex gap-4">
        {currentPage === 1 && <MyVideo />}
        {visibleMembers.map((member) => (
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
