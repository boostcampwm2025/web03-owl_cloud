import Image from 'next/image';

interface ProfileImgProps {
  profilePath: string | null;
  nickname: string;
  size: number;
}

export default function ProfileImg({
  profilePath,
  nickname,
  size,
}: ProfileImgProps) {
  return profilePath ? (
    <Image
      width={size}
      height={size}
      className="aspect-square rounded-full object-cover"
      style={{ width: size, height: size }}
      src={profilePath}
      alt={`${nickname}님의 프로필 사진`}
    />
  ) : (
    <div
      className={`flex-center aspect-square rounded-full bg-neutral-500 font-bold text-neutral-50 ${size >= 64 ? 'text-2xl' : size > 32 ? 'text-xl' : 'text-base'}`}
      style={{ width: size, height: size }}
    >
      {nickname[0]}
    </div>
  );
}
