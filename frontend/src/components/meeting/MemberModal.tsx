'use client';

import { CloseIcon } from '@/assets/icons/common';
import MemberListItem from '@/components/meeting/MemberListItem';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';

export default function MemberModal() {
  const { setIsOpen } = useMeetingStore();

  const { userId, nickname, profilePath } = useUserStore();

  const membersObj = useMeetingStore((state) => state.members);
  const members = Object.values(membersObj);

  const me = {
    user_id: userId,
    nickname: nickname,
    profile_path: profilePath,
    // TODO: 타입 맞춰야 함 -> me: MemberListItemProps
    is_guest: false,
  };

  const totalMembers = [me, ...members];

  const onCloseClick = () => setIsOpen('isMemberOpen', false);

  return (
    <aside className="meeting-side-modal z-6">
      <div className="flex-center relative h-12 w-full bg-neutral-800">
        <span className="font-bold text-neutral-200">
          참가자 ({totalMembers.length})
        </span>
        <button
          className="absolute top-2 right-2 rounded-sm p-1 hover:bg-neutral-700"
          onClick={onCloseClick}
        >
          <CloseIcon className="h-6 w-6 text-neutral-200" />
        </button>
      </div>

      <ul className="flex flex-1 flex-col overflow-y-auto">
        {totalMembers.map((member, index) => (
          <MemberListItem
            key={member.user_id}
            id={member.user_id}
            {...member}
            name={member.nickname}
            audio={false}
            video={false}
            // TODO
            // audio={!!member.mic && !member.mic.is_paused}
            // video={!!member.cam && !member.cam.is_paused}
            profileImg={member.profile_path as string}
            reverseDropdown={members.length > 3 && index >= members.length - 2}
          />
        ))}
      </ul>
    </aside>
  );
}
