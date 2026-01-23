// components/meeting/media/AudioView.tsx
import { useEffect, useRef } from 'react';

export default function AudioView({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline muted={false} />;
}
