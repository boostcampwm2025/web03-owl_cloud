'use client';

import { useEffect, useRef } from 'react';

interface VideoViewProps {
  stream: MediaStream;
  muted?: boolean;
  mirrored?: boolean;
}

export default function VideoView({
  stream,
  muted = true,
  mirrored = true,
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
      className={`h-full w-full object-contain ${mirrored ? '-scale-x-100' : ''}`}
    />
  );
}
