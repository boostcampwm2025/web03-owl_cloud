'use client';

import { DUMMY_MEMBERS } from '@/app/[meetingId]/dummy';
import { CloseIcon } from '@/assets/icons/common';
import MemberListItem from '@/components/meeting/MemberListItem';
import { useMeetingStore } from '@/store/useMeetingStore';

export default function MemberModal() {
  // 이후 API로 수정 필요
  const members = DUMMY_MEMBERS;

  const { setIsOpen } = useMeetingStore();

  const onCloseClick = () => setIsOpen('isMemberOpen', false);

  return (
    <aside className="meeting-side-modal">
      <div className="flex-center relative h-12 w-full bg-neutral-800">
        <span className="font-bold text-neutral-200">
          참가자 ({members.length})
        </span>
        <button
          className="absolute top-2 right-2 rounded-sm p-1 hover:bg-neutral-700"
          onClick={onCloseClick}
        >
          <CloseIcon className="h-6 w-6 text-neutral-200" />
        </button>
      </div>

      <ul className="flex flex-1 flex-col overflow-y-auto">
        {members.map((member, index) => (
          <MemberListItem
            key={member.id}
            {...member}
            reverseDropdown={members.length > 3 && index >= members.length - 2}
          />
        ))}
      </ul>
    </aside>
  );
}
