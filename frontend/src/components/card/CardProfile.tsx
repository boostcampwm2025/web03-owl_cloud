import { DUMMY_USER } from '@/app/card/[id]/dummy';
import FollowBtn from '@/components/card/FollowBtn';
import Image from 'next/image';
import Link from 'next/link';

export default function CardProfile() {
  // API 호출 부분
  const { user_id, nickname, profile_path } = DUMMY_USER;

  return (
    <div className="flex items-center gap-4">
      <Link href={`/user/${user_id}`} className="group flex items-center gap-2">
        <Image
          src={profile_path}
          width={32}
          height={32}
          alt={`${nickname}의 프로필 사진`}
          className="h-8 w-8 overflow-hidden rounded-full object-cover"
        />
        <span className="text-sm font-semibold text-neutral-900 group-hover:underline">
          {nickname}
        </span>
      </Link>
      <FollowBtn hasFollowed={false} />
    </div>
  );
}
