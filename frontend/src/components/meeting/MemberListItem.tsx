import { MoreVertIcon } from '@/assets/icons/common';
import {
  CamOffIcon,
  CamOnIcon,
  MicOffIcon,
  MicOnIcon,
} from '@/assets/icons/meeting';
import ProfileImg from '@/components/common/ProfileImg';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import { useRef, useState } from 'react';

interface MemberListItemProps {
  id: string;
  name: string;
  audio: boolean;
  video: boolean;
  profileImg: string | null;
  reverseDropdown?: boolean;
}

export default function MemberListItem({
  id,
  name,
  audio,
  video,
  profileImg,
  reverseDropdown,
}: MemberListItemProps) {
  const { togglePin } = useMeetingStore();
  const isPinned = useMeetingStore((state) =>
    state.pinnedMemberIds.includes(id),
  );
  const { userId } = useUserStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsDropdownOpen(false), isDropdownOpen);

  const onMoreClick = () => setIsDropdownOpen((prev) => !prev);
  const closeDropdown = () => setIsDropdownOpen(false);

  return (
    <li className="group flex items-center gap-2 p-4">
      {/* 참가자 정보 */}
      <div className="flex flex-1 items-center gap-3">
        <ProfileImg profilePath={profileImg} nickname={name} size={32} />
        <span className="ellipsis w-full text-neutral-50">{name}</span>
      </div>

      {/* 참가자 상태 */}
      <div
        className={`gap-4 text-neutral-400 ${userId !== id ? 'group-hover:hidden' : ''} ${isDropdownOpen ? 'hidden' : 'flex'}`}
      >
        {audio ? (
          <MicOnIcon className="h-5 w-5" />
        ) : (
          <MicOffIcon className="h-5 w-5" />
        )}
        {video ? (
          <CamOnIcon className="h-5 w-5" />
        ) : (
          <CamOffIcon className="h-5 w-5" />
        )}
      </div>

      {/* 더보기 버튼 */}
      <div
        ref={ref}
        className={`relative ${userId !== id ? 'group-hover:flex' : ''} ${isDropdownOpen ? 'flex' : 'hidden'}`}
      >
        <button
          className="rounded-full p-1 hover:bg-neutral-600"
          onClick={onMoreClick}
        >
          <MoreVertIcon className="h-5 w-5 text-neutral-200" />
        </button>

        {isDropdownOpen && (
          <menu
            className={`absolute right-0 w-40 rounded-sm border border-neutral-500 bg-neutral-600 ${reverseDropdown ? '-top-2 -translate-y-full' : 'top-[calc(100%+8px)]'}`}
          >
            <button
              className="dropdown-btn"
              onClick={() => {
                togglePin(id);
                closeDropdown();
              }}
            >
              {isPinned ? '고정 해제' : '고정'}
            </button>
          </menu>
        )}
      </div>
    </li>
  );
}
