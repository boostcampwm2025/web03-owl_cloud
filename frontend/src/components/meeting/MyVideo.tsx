import { MicOffIcon } from '@/assets/icons/meeting';
import VideoView from '@/components/meeting/media/VideoView';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useVoiceActivity } from '@/hooks/useVoiceActivity';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';

export default function MyVideo({ width = '160px' }: { width?: string }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsDropdownOpen(false), isDropdownOpen);

  const { media } = useMeetingStore();
  const { nickname, profilePath } = useUserStore();
  const { producers } = useMeetingSocketStore();

  // 영상 정보 가져오기
  const localVideoStream = useMemo(() => {
    const track = producers.videoProducer?.track;
    if (!track) return null;
    return new MediaStream([track]);
  }, [producers.videoProducer]);

  // 음성 정보 가져오기
  const localAudioStream = useMemo(() => {
    const track = producers.audioProducer?.track;
    if (!track) return null;
    return new MediaStream([track]);
  }, [producers.audioProducer]);

  const isSpeaking = useVoiceActivity(localAudioStream);

  return (
    <div
      style={{ width }}
      className="group flex-center relative aspect-video max-h-full max-w-full rounded-lg bg-neutral-700"
    >
      {/* 테두리 영역 */}
      {media.audioOn && isSpeaking && (
        <div className="pointer-events-none absolute inset-0 z-5 rounded-lg border-3 border-sky-500" />
      )}

      {/* 영상 */}
      {media.videoOn && localVideoStream ? (
        <div className="flex-center h-full w-full overflow-hidden rounded-lg">
          <VideoView stream={localVideoStream} />
        </div>
      ) : profilePath ? (
        <Image
          width={64}
          height={64}
          className="aspect-square w-16 rounded-full object-cover"
          src={profilePath}
          alt={`${nickname}님의 프로필 사진`}
        />
      ) : (
        <div className="flex-center aspect-square w-16 rounded-full bg-neutral-500 text-2xl font-bold text-neutral-50">
          {nickname[0]}
        </div>
      )}

      {/* 이름표 */}
      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1 rounded-sm bg-neutral-900 p-1">
        {!media.audioOn && <MicOffIcon className="h-3 w-3 shrink-0" />}
        <span className="ellipsis w-full text-xs font-bold text-neutral-200">
          {nickname}
        </span>
      </div>
    </div>
  );
}
