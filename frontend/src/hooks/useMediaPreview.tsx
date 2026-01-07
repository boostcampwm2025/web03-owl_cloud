'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type MediaPermission = 'unknown' | 'granted' | 'denied';

export interface MediaState {
  videoOn: boolean;
  audioOn: boolean;
  cameraPermission: MediaPermission;
  micPermission: MediaPermission;
}

export const useMediaPreview = (micId?: string, cameraId?: string) => {
  const [media, setMedia] = useState<MediaState>({
    videoOn: false,
    audioOn: false,
    cameraPermission: 'unknown',
    micPermission: 'unknown',
  });

  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: micId ? { deviceId: micId } : true,
          video: cameraId ? { deviceId: cameraId } : true,
        });

        if (cancelled) return;

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = mediaStream;
        setStream(mediaStream);

        setMedia({
          videoOn: true,
          audioOn: true,
          cameraPermission: 'granted',
          micPermission: 'granted',
        });
      } catch {
        if (cancelled) return;

        setMedia((prev) => ({
          ...prev,
          cameraPermission: 'denied',
          micPermission: 'denied',
        }));
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [micId, cameraId]);

  const toggleVideo = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMedia((prev) => ({ ...prev, videoOn: track.enabled }));
    });
  }, []);

  const toggleAudio = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMedia((prev) => ({ ...prev, audioOn: track.enabled }));
    });
  }, []);

  const canRenderVideo = useMemo(() => {
    return (
      media.videoOn && media.cameraPermission === 'granted' && stream !== null
    );
  }, [media.videoOn, media.cameraPermission, stream]);

  return {
    media,
    stream,
    canRenderVideo,
    toggleVideo,
    toggleAudio,
  };
};
