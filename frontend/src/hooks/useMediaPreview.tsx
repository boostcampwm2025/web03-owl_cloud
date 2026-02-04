'use client';

import { useMeetingStore } from '@/store/useMeetingStore';
import { MediaPermission } from '@/types/meeting';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const useMediaPreview = (micId?: string, cameraId?: string) => {
  const { media, setMedia } = useMeetingStore();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 브라우저 권한 변경 감지
  useEffect(() => {
    const watchPermissions = async () => {
      try {
        const [camStatus, micStatus] = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ]);

        const updateStatus = () => {
          const mapPermission = (state: PermissionState): MediaPermission => {
            if (state === 'prompt') return 'unknown';
            return state as MediaPermission;
          };

          const nextCamPerm = mapPermission(camStatus.state);
          const nextMicPerm = mapPermission(micStatus.state);

          // 권한이 거부되면 UI 동기화 및 스트림 정지
          setMedia({
            cameraPermission: nextCamPerm,
            micPermission: nextMicPerm,
            ...(nextCamPerm === 'denied' && { videoOn: false }),
            ...(nextMicPerm === 'denied' && { audioOn: false }),
          });

          if (nextCamPerm === 'denied' || nextMicPerm === 'denied') {
            streamRef.current?.getTracks().forEach((track) => {
              if (
                (track.kind === 'video' && nextCamPerm === 'denied') ||
                (track.kind === 'audio' && nextMicPerm === 'denied')
              ) {
                track.stop();
                streamRef.current?.removeTrack(track);
              }
            });
          }
        };

        camStatus.onchange = updateStatus;
        micStatus.onchange = updateStatus;

        updateStatus();
      } catch (error) {
        console.warn('Permissions API not supported', error);
      }
    };

    watchPermissions();
  }, [setMedia]);

  // 초기 스트림 생성 로직
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let audioTrack: MediaStreamTrack | null = null;
      let videoTrack: MediaStreamTrack | null = null;

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: micId ? { deviceId: micId } : true,
          video: false,
        });
        audioTrack = audioStream.getAudioTracks()[0];

        if (cancelled) return;
        setMedia({
          micPermission: 'granted',
          audioOn: true, // 초기화 시 켜짐
        });
      } catch {
        if (cancelled) return;
        setMedia({ micPermission: 'denied', audioOn: false });
      }

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: cameraId ? { deviceId: cameraId } : true,
        });
        videoTrack = videoStream.getVideoTracks()[0];

        if (cancelled) return;
        setMedia({
          cameraPermission: 'granted',
          videoOn: true, // 초기화 시 켜짐
        });
      } catch {
        if (cancelled) return;
        setMedia({ cameraPermission: 'denied', videoOn: false });
      }

      if (cancelled) return;

      // stream 합치기
      const tracks = [
        ...(audioTrack ? [audioTrack] : []),
        ...(videoTrack ? [videoTrack] : []),
      ];

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;
      setStream(combinedStream);
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [micId, cameraId]);

  const toggleVideo = useCallback(async () => {
    if (!streamRef.current) return;

    if (media.videoOn) {
      // off시 트랙 중지 및 스트림에서 제거
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setMedia({ videoOn: false });
    } else {
      // on시 새로운 장치 스트림 요청
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: cameraId ? { deviceId: cameraId } : true,
        });
        const newTrack = newStream.getVideoTracks()[0];

        streamRef.current.addTrack(newTrack);
        setMedia({
          videoOn: true,
          cameraPermission: 'granted',
        });
      } catch (error) {
        // TODO: 토스트 메시지로 바꾸기
        alert('카메라 권한을 허용해주세요.');
      }
    }
  }, [media.videoOn, cameraId, setMedia]);

  const toggleAudio = useCallback(async () => {
    if (!streamRef.current) return;

    if (media.audioOn) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setMedia({ audioOn: false });
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: micId ? { deviceId: micId } : true,
        });
        const newTrack = newStream.getAudioTracks()[0];

        streamRef.current.addTrack(newTrack);
        setMedia({
          audioOn: true,
          micPermission: 'granted',
        });
      } catch (error) {
        // TODO: 토스트 메시지로 바꾸기
        alert('마이크 권한을 허용해주세요.');
      }
    }
  }, [media.audioOn, micId, setMedia]);

  const canRenderVideo = useMemo(() => {
    return (
      media.videoOn &&
      media.cameraPermission === 'granted' &&
      stream !== null &&
      stream.getVideoTracks().length > 0
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
