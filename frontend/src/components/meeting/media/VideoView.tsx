'use client';

import { useEffect, useRef } from 'react';

interface VideoViewProps {
  stream: MediaStream;
  muted?: boolean;
  mirrored?: boolean;
  objectFit?: 'object-cover' | 'object-contain';
}

export default function VideoView({
  stream,
  muted = true,
  mirrored = true,
  objectFit = 'object-cover',
}: VideoViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    // Safari와 iOS 대응
    video.onloadedmetadata = () => {
      video.play().catch(() => {
        // autoplay 정책 실패 시 무시
      });
    };

    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      muted={muted}
      playsInline
      autoPlay
      className={`h-full w-full ${objectFit} ${mirrored ? '-scale-x-100' : ''}`}
    />
  );
}
