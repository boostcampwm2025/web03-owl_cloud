import {
  CamOffIcon,
  CamOnIcon,
  MicOffIcon,
  MicOnIcon,
} from '@/assets/icons/meeting';
import VideoView from './VideoView';
import { useMediaPreview } from '@/hooks/useMediaPreview';

export function MediaPreview() {
  const { media, stream, canRenderVideo, toggleAudio, toggleVideo } =
    useMediaPreview();

  const hasCamDenied =
    media.cameraPermission === 'denied' || media.cameraPermission === 'unknown';
  const hasMicDenied =
    media.micPermission === 'denied' || media.micPermission === 'unknown';

  const getDeniedMediaText = () => {
    if (hasCamDenied && hasMicDenied) return '카메라와 마이크';
    if (hasCamDenied) return '카메라';
    if (hasMicDenied) return '마이크';
    return '';
  };
  const deniedText = getDeniedMediaText();

  return (
    <div
      className={`relative box-border aspect-video h-fit w-full overflow-hidden rounded-2xl bg-neutral-700 ${!canRenderVideo && 'p-4'}`}
    >
      {/* Video Layer */}
      {canRenderVideo && stream && <VideoView stream={stream} />}

      {/* Placeholder Layer */}
      {!canRenderVideo && (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
          <p className="text-sm font-bold whitespace-pre-wrap text-white">
            {hasCamDenied || hasMicDenied ? (
              <>{`브라우저 설정에서\n${deniedText} 권한을 허용해 주세요`}</>
            ) : (
              <>카메라가 꺼져 있어요</>
            )}
          </p>
        </div>
      )}

      {/* Control Layer */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-6 max-sm:bottom-4 max-sm:gap-4">
        <button onClick={toggleVideo} className="group">
          {media.videoOn ? (
            <CamOnIcon className="h-12 w-12 rounded-full bg-white p-3 text-neutral-700 shadow-lg transition-all group-active:scale-95 max-sm:h-9 max-sm:w-9 max-sm:p-2" />
          ) : (
            <CamOffIcon className="h-12 w-12 rounded-full bg-white p-3 shadow-lg transition-all group-active:scale-95 max-sm:h-9 max-sm:w-9 max-sm:p-2" />
          )}
        </button>

        <button onClick={toggleAudio} className="group">
          {media.audioOn ? (
            <MicOnIcon className="h-12 w-12 rounded-full bg-white p-3 text-neutral-700 shadow-lg transition-all group-active:scale-95 max-sm:h-9 max-sm:w-9 max-sm:p-2" />
          ) : (
            <MicOffIcon className="h-12 w-12 rounded-full bg-white p-3 shadow-lg transition-all group-active:scale-95 max-sm:h-9 max-sm:w-9 max-sm:p-2" />
          )}
        </button>
      </div>
    </div>
  );
}
