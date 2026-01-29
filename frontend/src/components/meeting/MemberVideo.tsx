import { MoreHoriIcon } from '@/assets/icons/common';
import { MicOffIcon, PinIcon } from '@/assets/icons/meeting';
import ProfileImg from '@/components/common/ProfileImg';
import VideoView from '@/components/meeting/media/VideoView';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useMeetingStore } from '@/store/useMeetingStore';
import { MeetingMemberInfo } from '@/types/meeting';
import { useRef, useState } from 'react';

export default function MemberVideo({
  user_id,
  nickname,
  profile_path,
  width = '160px',
}: MeetingMemberInfo & { width?: string }) {
  const isPinned = useMeetingStore((state) =>
    state.pinnedMemberIds.includes(user_id),
  );
  const togglePin = useMeetingStore((state) => state.togglePin);
  const streams = useMeetingStore((state) => state.memberStreams[user_id]);
  const isSpeaking = useMeetingStore((state) => state.speakingMembers[user_id]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsDropdownOpen(false), isDropdownOpen);

  const onMoreClick = () => setIsDropdownOpen((prev) => !prev);
  const closeDropdown = () => setIsDropdownOpen(false);

  return (
    <div
      style={{ width }}
      className={`group flex-center relative aspect-video max-h-full max-w-full rounded-lg bg-neutral-700`}
    >
      {/* 테두리 영역 */}
      {isSpeaking && (
        <div className="pointer-events-none absolute inset-0 z-5 rounded-lg border-3 border-sky-500" />
      )}

      {/* 영상 */}
      {streams?.cam ? (
        <div className="flex-center h-full w-full overflow-hidden rounded-lg">
          <VideoView stream={streams.cam} />
        </div>
      ) : (
        <ProfileImg profilePath={profile_path} nickname={nickname} size={64} />
      )}

      {/* 이름표 */}
      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1 rounded-sm bg-neutral-900 p-1">
        {isPinned && <PinIcon className="h-3 w-3 shrink-0 text-neutral-200" />}
        {!streams?.mic && <MicOffIcon className="h-3 w-3 shrink-0" />}
        <span className="ellipsis w-full text-xs font-bold text-neutral-200">
          {nickname}
        </span>
      </div>

      {/* 더보기 메뉴 */}
      <div
        ref={ref}
        className={`absolute top-2 right-2 group-hover:flex ${isDropdownOpen ? 'flex' : 'hidden'}`}
      >
        <button className="rounded-sm bg-sky-700 p-0.5" onClick={onMoreClick}>
          <MoreHoriIcon className="h-4 w-4 text-neutral-50" />
        </button>

        {isDropdownOpen && (
          <menu className="absolute top-[calc(100%+8px)] right-0 z-100 w-40 rounded-sm border border-neutral-500 bg-neutral-600">
            <button
              className="dropdown-btn"
              onClick={() => {
                togglePin(user_id);
                closeDropdown();
              }}
            >
              {isPinned ? '고정 해제' : '고정'}
            </button>
          </menu>
        )}
      </div>
    </div>
  );
}
