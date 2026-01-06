import { MoreHoriIcon } from '@/assets/icons/common';
import { MicOffIcon } from '@/assets/icons/meeting';
import Image from 'next/image';
import { useState } from 'react';

interface SmVideoProps {
  name: string;
  audio: boolean;
  video: boolean;
  speaking: boolean;
  profileImg: string;

  // 이후 음성이나 영상 정보 추가 필요
}

export default function SmVideo({
  name,
  audio,
  video,
  speaking,
  profileImg,
}: SmVideoProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const onMoreClick = () => setIsDropdownOpen((prev) => !prev);

  return (
    <div
      className={`group flex-center relative aspect-video w-40 rounded-lg bg-neutral-700 ${speaking ? 'outline-3 -outline-offset-3 outline-sky-500' : ''}`}
    >
      {/* 영상 */}
      {video ? (
        <Image
          width={160}
          height={90}
          className="aspect-video w-40 rounded-lg object-cover"
          src={profileImg}
          alt={`${name}님의 프로필 사진`}
        />
      ) : (
        <Image
          width={64}
          height={64}
          className="aspect-square w-16 rounded-full object-cover"
          src={profileImg}
          alt={`${name}님의 프로필 사진`}
        />
      )}

      {/* 이름표 */}
      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1 rounded-sm bg-neutral-900 p-1">
        {!audio && <MicOffIcon className="h-3 w-3 shrink-0" />}
        <span className="ellipsis w-full text-xs font-bold text-neutral-200">
          {name}
        </span>
      </div>

      {/* 더보기 메뉴 */}
      <div
        className={`absolute top-2 right-2 group-hover:flex ${isDropdownOpen ? 'flex' : 'hidden'}`}
      >
        <button className="rounded-sm bg-sky-700 p-0.5" onClick={onMoreClick}>
          <MoreHoriIcon className="h-4 w-4 text-neutral-50" />
        </button>
        {isDropdownOpen && (
          <menu className="absolute top-[calc(100%+8px)] right-0 w-40 rounded-sm border border-neutral-500 bg-neutral-600">
            <button className="dropdown-btn">드롭다운 메뉴1</button>
            <button className="dropdown-btn">드롭다운 메뉴2</button>
            <button className="dropdown-btn">드롭다운 메뉴3</button>
          </menu>
        )}
      </div>
    </div>
  );
}
