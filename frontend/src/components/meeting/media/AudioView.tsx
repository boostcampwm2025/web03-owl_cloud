import { useVoiceActivity } from '@/hooks/useVoiceActivity';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useMeetingStore } from '@/store/useMeetingStore';
import { getMembersPerPage } from '@/utils/meeting';
import { useEffect, useMemo, useRef } from 'react';

export default function AudioView({
  stream,
  userId,
}: {
  stream: MediaStream;
  userId: string;
}) {
  const { width } = useWindowSize();

  const membersPerPage = useMemo(() => {
    return getMembersPerPage(width);
  }, [width]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const isSpeaking = useVoiceActivity(stream);
  const { media, setSpeaking } = useMeetingStore();

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    // 스피커 장치 변경
    if ('setSinkId' in HTMLAudioElement.prototype) {
      audioEl.setSinkId(media.speakerId);
    }
  }, [media.speakerId, userId]);

  useEffect(() => {
    setSpeaking(userId, isSpeaking, membersPerPage);
    return () => setSpeaking(userId, false, membersPerPage);
  }, [isSpeaking, userId, setSpeaking]);

  return <audio ref={audioRef} autoPlay playsInline muted={false} />;
}