// components/meeting/media/AudioView.tsx
import { useVoiceActivity } from '@/hooks/useVoiceActivity';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useEffect, useRef } from 'react';

export default function AudioView({
  stream,
  userId,
}: {
  stream: MediaStream;
  userId: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  const isSpeaking = useVoiceActivity(stream);
  const { setSpeaking } = useMeetingStore();

  useEffect(() => {
    setSpeaking(userId, isSpeaking);

    return () => setSpeaking(userId, false);
  }, [isSpeaking, userId, setSpeaking]);

  return <audio ref={audioRef} autoPlay playsInline muted={false} />;
}
