import { useMediaDevices } from '@/hooks/useMediaDevices';
import Button from '../common/button';
import { DeviceDropdown } from './DeviceDropdown';
import { MediaPreview } from './media/MediaPreview';
import { CamOnIcon, MicOnIcon, VolumnIcon } from '@/assets/icons/meeting';

export default function MeetingLobby({
  meetingId,
  onJoin,
}: {
  meetingId: string;
  onJoin: () => void;
}) {
  const meetingLeader = 'Tony';
  const meetingMemberCnt = 9;

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
    <main className="box-border flex min-h-screen items-center justify-center gap-20 px-6 py-4">
      {/* 영상, 마이크 설정 부분 */}
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

      {/* 회의 참여 부분 */}
      <section className="flex w-full max-w-60 flex-col items-center justify-center">
        <h1 className="mb-2 text-2xl text-neutral-900">
          <b>{meetingLeader}</b> 님의 회의실
        </h1>
        <span className="text-base text-neutral-600">
          현재 참여자: {meetingMemberCnt}명
        </span>

        <Button className="mt-6" onClick={onJoin}>
          회의 참여하기
        </Button>
      </section>
    </main>
  );
}
