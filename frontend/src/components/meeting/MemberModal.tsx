'use client';

import { CloseIcon } from '@/assets/icons/common';
import MemberListItem from '@/components/meeting/MemberListItem';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';

export default function MemberModal() {
  const { media, setIsOpen, memberStreams } = useMeetingStore();

  const { userId, nickname, profilePath } = useUserStore();

  const membersObj = useMeetingStore((state) => state.members);
  const members = Object.values(membersObj);

  const me = {
    user_id: userId,
    nickname: nickname,
    profile_path: profilePath,
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

      <ul className="chat-scrollbar flex flex-1 flex-col overflow-y-auto">
        {totalMembers.map((member, index) => (
          <MemberListItem
            key={member.user_id}
            id={member.user_id}
            {...member}
            name={member.nickname}
            audio={
              index === 0 ? media.audioOn : !!memberStreams[member.user_id]?.mic
            }
            video={
              index === 0 ? media.videoOn : !!memberStreams[member.user_id]?.cam
            }
            profileImg={member.profile_path}
            reverseDropdown={members.length > 3 && index >= members.length - 2}
          />
        ))}
      </ul>
    </aside>
  );
}
