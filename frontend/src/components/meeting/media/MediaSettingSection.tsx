import { DeviceDropdown } from '@/components/meeting/DeviceDropdown';
import { MediaPreview } from '@/components/meeting/media/MediaPreview';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { CamOnIcon, MicOnIcon, VolumnIcon } from '@/assets/icons/meeting';

export default function MediaSettingSection() {
  const {
    microphones,
    cameras,
    speakers,
    micId,
    cameraId,
    speakerId,
    setMicId,
    setCameraId,
    setSpeakerId,
  } = useMediaDevices();

  return (
    <section className="flex w-full max-w-160 flex-col gap-6">
      <MediaPreview />

      <div className="flex w-full items-center gap-4 text-sm">
        <DeviceDropdown
          label="스피커"
          devices={speakers}
          icon={VolumnIcon}
          selectedId={speakerId}
          onSelect={setSpeakerId}
          className="flex-1"
        />

        <DeviceDropdown
          label="마이크"
          devices={microphones}
          icon={MicOnIcon}
          selectedId={micId}
          onSelect={setMicId}
          className="flex-1"
        />

        <DeviceDropdown
          label="카메라"
          devices={cameras}
          icon={CamOnIcon}
          selectedId={cameraId}
          onSelect={setCameraId}
          className="flex-1"
        />
      </div>
    </section>
  );
}
