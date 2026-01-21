import { Consumer } from 'mediasoup-client/types';
import { useEffect, useRef } from 'react';

export default function AudioPlayer({ consumer }: { consumer: Consumer }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && consumer.track) {
      const stream = new MediaStream([consumer.track]);
      audioRef.current.srcObject = stream;
    }
  }, [consumer]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
