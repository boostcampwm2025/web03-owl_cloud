'use client';

import { useMeetingStore } from '@/store/useMeetingStore';
import { useEffect, useState } from 'react';

export type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

export const useMediaDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const { setSpeakerId, setCameraId, setMicId } = useMeetingStore();

  useEffect(() => {
    const updateDevices = async () => {
      const list = await navigator.mediaDevices.enumerateDevices();

      const validDevices = list.filter((d) => d.label !== '');
      setDevices(validDevices);

      if (validDevices.length === 0) return;

      const mic = validDevices.find((d) => d.kind === 'audioinput');
      const cam = validDevices.find((d) => d.kind === 'videoinput');
      const speaker = validDevices.find((d) => d.kind === 'audiooutput');

      const currentMedia = useMeetingStore.getState().media;

      if (mic && !currentMedia.micId) {
        setMicId(mic.deviceId);
      }
      if (cam && !currentMedia.cameraId) {
        setCameraId(cam.deviceId);
      }
      if (speaker && !currentMedia.speakerId) {
        setSpeakerId(speaker.deviceId);
      }
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

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
    };
  }, []);

  const byKind = (kind: DeviceKind) => devices.filter((d) => d.kind === kind);

  return {
    microphones: byKind('audioinput'),
    cameras: byKind('videoinput'),
    speakers: byKind('audiooutput'),
  };
};
