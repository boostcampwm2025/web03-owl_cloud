'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons/common';
import SmVideo from '@/components/meeting/SmVideo';
import { useState } from 'react';

export default function MemberVideoBar() {
  const { lastPage, members } = DUMMY_DATA;
  const [currentPage, setCurrentPage] = useState(1);
  const [hasPrevPage, hasNextPage] = [currentPage > 1, currentPage < lastPage];

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
        <ChevronLeftIcon className={`h-8 w-8`} />
      </button>

      <section className="flex gap-4">
        {members.map((member) => (
          <SmVideo key={member.id} {...member} />
        ))}
      </section>

      <button
        className={`h-full rounded-sm ${hasNextPage ? 'text-neutral-200 hover:bg-neutral-700' : 'cursor-default! text-neutral-700'}`}
        onClick={onNextClick}
      >
        <ChevronRightIcon className={`h-8 w-8`} />
      </button>
    </header>
  );
}

// 더미 데이터
const DUMMY_MEMBERS = [
  {
    id: '1',
    name: 'Tony',
    audio: true,
    video: false,
    speaking: true,
    profileImg: `https://picsum.photos/id/237/200/200`,
  },
  {
    id: '2',
    name: 'Logan',
    audio: false,
    video: false,
    speaking: false,
    profileImg: `https://picsum.photos/id/238/200/200`,
  },
  {
    id: '3',
    name: 'Andrew',
    audio: true,
    video: true,
    speaking: false,
    profileImg: `https://picsum.photos/id/239/200/200`,
  },
  {
    id: '4',
    name: 'Lisey',
    audio: true,
    video: true,
    speaking: true,
    profileImg: `https://picsum.photos/id/240/200/200`,
  },
  {
    id: '5',
    name: 'Kuma',
    audio: true,
    video: true,
    speaking: false,
    profileImg: `https://picsum.photos/id/241/200/200`,
  },
  {
    id: '6',
    name: 'Robert John Downey Junior',
    audio: false,
    video: true,
    speaking: false,
    profileImg: `https://picsum.photos/id/242/200/200`,
  },
];

const DUMMY_DATA = {
  page: 1,
  lastPage: 2,
  membersPerPage: 6,
  members: DUMMY_MEMBERS,
};
