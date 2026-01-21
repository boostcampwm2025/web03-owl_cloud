import AudioPlayer from '@/components/meeting/media/AudioPlayer';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';

export const GlobalAudioPlayer = () => {
  const consumers = useMeetingSocketStore((state) => state.consumers);

  return (
    <div id="remote-audio-container" style={{ display: 'none' }}>
      {Object.entries(consumers).map(([userId, memberConsumer]) => {
        if (!memberConsumer.audio) return null;

        // 오디오 트랙 전 전용 컴포넌트 호출
        return (
          <AudioPlayer
            key={`${userId}-audio`}
            consumer={memberConsumer.audio}
          />
        );
      })}
    </div>
  );
};
