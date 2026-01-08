import {
  CamOffIcon,
  CamOnIcon,
  MicOffIcon,
  MicOnIcon,
} from '@/assets/icons/meeting';
import Button from '@/components/common/button';
import VideoView from './VideoView';
import { useMediaPreview } from '@/hooks/useMediaPreview';

export function MediaPreview() {
  const { media, stream, canRenderVideo, toggleAudio, toggleVideo } =
    useMediaPreview();

  //   console.log(media);

  return (
    <div
      className={`relative box-border h-90 w-160 overflow-hidden rounded-2xl bg-neutral-700 ${!canRenderVideo && 'p-4'}`}
    >
      {/* Video Layer */}
      {canRenderVideo && stream && <VideoView stream={stream} />}

      {/* Placeholder Layer */}
      {!canRenderVideo && (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
          <p className="text-sm font-bold text-white">
            {media.cameraPermission === 'denied' ? (
              <>
                브라우저 주소창의 자물쇠 아이콘을 눌러
                <br />
                카메라와 마이크 권한을 허용해 주세요.
              </>
            ) : (
              <>
                마이크와 카메라를 사용하려면
                <br />
                접근 권한이 필요해요
              </>
            )}
          </p>

          {(media.cameraPermission === 'unknown' ||
            media.micPermission === 'unknown') && (
            <Button
              size="sm"
              shape="square"
              className="px-3 py-2 text-sm"
              //   onClick={requestPermission}
            >
              마이크 및 카메라 접근 허용
            </Button>
          )}
        </div>
      )}

      {/* Control Layer */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-6">
        <button onClick={toggleVideo} className="group">
          {media.videoOn ? (
            <CamOnIcon className="h-12 w-12 rounded-full bg-white p-3 text-neutral-700 shadow-lg transition-all group-active:scale-95" />
          ) : (
            <CamOffIcon className="h-12 w-12 rounded-full bg-white p-3 shadow-lg transition-all group-active:scale-95" />
          )}
        </button>

        <button onClick={toggleAudio} className="group">
          {media.audioOn ? (
            <MicOnIcon className="h-12 w-12 rounded-full bg-white p-3 text-neutral-700 shadow-lg transition-all group-active:scale-95" />
          ) : (
            <MicOffIcon className="h-12 w-12 rounded-full bg-white p-3 shadow-lg transition-all group-active:scale-95" />
          )}
        </button>
      </div>
    </div>
  );
}
