'use client';

import { useEffect, useState } from 'react';

export type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

export const useMediaDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const [speakerId, setSpeakerId] = useState<string>('');
  const [micId, setMicId] = useState<string>('');
  const [cameraId, setCameraId] = useState<string>('');

  useEffect(() => {
    const updateDevices = async () => {
      const list = await navigator.mediaDevices.enumerateDevices();

      const validDevices = list.filter((d) => d.label !== '');
      setDevices(validDevices);

      const mic = list.find((d) => d.kind === 'audioinput');
      const cam = list.find((d) => d.kind === 'videoinput');
      const speaker = list.find((d) => d.kind === 'audiooutput');

      if (mic) setMicId(mic.deviceId);
      if (cam) setCameraId(cam.deviceId);
      if (speaker) setSpeakerId(speaker.deviceId);
    };

    updateDevices();

    navigator.mediaDevices.addEventListener('devicechange', updateDevices);

    const watchPermissions = async () => {
      try {
        const camStatus = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        const micStatus = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });

        camStatus.onchange = updateDevices;
        micStatus.onchange = updateDevices;
      } catch (error) {
        console.warn(
          'Permissions API is not fully supported in this browser.',
          error,
        );
      }
    };

    watchPermissions();

    // [추가] 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
    };
  }, []);

  const byKind = (kind: DeviceKind) => devices.filter((d) => d.kind === kind);

  return {
    microphones: byKind('audioinput'),
    cameras: byKind('videoinput'),
    speakers: byKind('audiooutput'),

    micId,
    cameraId,
    speakerId,

    setMicId,
    setCameraId,
    setSpeakerId,
  };
};
