import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { createProduceHelper } from '@/utils/createProduceHelpers';
import { useMemo } from 'react';

export const useProduce = () => {
  const { socket, sendTransport, setProducer, setIsProducing } =
    useMeetingSocketStore();
  const { setMedia } = useMeetingStore();

  // sendTransport가 초기화 된 이후 createProduceHelper 선언
  const helpers = useMemo(() => {
    if (!socket || !sendTransport) return null;
    return createProduceHelper(sendTransport);
  }, [sendTransport]);

  const startAudioProduce = async () => {
    // 함수가 호출되었을 시점의 값을 위해 getState() 사용
    const { producers, isProducing } = useMeetingSocketStore.getState();

    // 이미 Producer가 있거나, 현재 생성 중이라면(strictMode로 인한 2번 호출 방지) 리턴
    if (!helpers || producers.audioProducer || isProducing.audio) {
      return;
    }

    try {
      // audio produce에 대한 락 설정
      setIsProducing('audio', true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];

      const audioProducer = await helpers.produceMic(audioTrack);
      setProducer('audioProducer', audioProducer);
      setMedia({ audioOn: true });

      // 중간에 연결이 끊겼을 때의 핸들링
      audioProducer.on('trackended', () => {
        stopAudioProduce();
      });
    } catch (error) {
      console.error('마이크 시작 실패:', error);
    } finally {
      // 락 해제
      setIsProducing('audio', false);
    }
  };

  const stopAudioProduce = () => {
    const { audioProducer } = useMeetingSocketStore.getState().producers;

    if (socket && audioProducer) {
      // Mediasoup 전송 중단
      audioProducer.close();
      // 실제 하드웨어 정지
      audioProducer.track?.stop();
      // 서버에 OFF 신호 전달
      socket.emit('signaling:ws:produce_off', {
        producer_id: audioProducer.id,
        kind: 'audio',
      });

      setProducer('audioProducer', null);
      setMedia({ audioOn: false });
    }
  };

  const startVideoProduce = async () => {
    const { producers, isProducing } = useMeetingSocketStore.getState();
    if (!helpers || producers.videoProducer || isProducing.video) {
      return;
    }

    try {
      setIsProducing('video', true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];

      const videoProducer = await helpers.produceCam(videoTrack);
      setProducer('videoProducer', videoProducer);
      setMedia({ videoOn: true });

      videoProducer.on('trackended', () => {
        stopVideoProduce();
      });
    } catch (error) {
      console.error('카메라 시작 실패:', error);
    } finally {
      setIsProducing('video', false);
    }
  };

  const stopVideoProduce = () => {
    const { videoProducer } = useMeetingSocketStore.getState().producers;

    if (socket && videoProducer) {
      socket.emit('signaling:ws:produce_off', {
        producer_id: videoProducer.id,
        kind: 'audio',
      });
      videoProducer.close();
      videoProducer.track?.stop();
      setProducer('videoProducer', null);
      setMedia({ videoOn: false });
    }
  };

  const startScreenProduce = async () => {
    const { producers, isProducing } = useMeetingSocketStore.getState();
    if (
      !helpers ||
      (producers.screenAudioProducer && producers.screenVideoProducer) ||
      isProducing.screen
    )
      return;

    let stream: MediaStream | null = null;

    try {
      setIsProducing('screen', true);

      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0] ?? null;

      // 화면 produce 시도 (여기서 서버가 막으면 예외 발생)
      const videoProducer = await helpers.produceScreenVideo(videoTrack);
      setProducer('screenVideoProducer', videoProducer);

      // (선택) 오디오도 함께 보낼 경우
      if (audioTrack) {
        const audioProducer = await helpers.produceScreenAudio(audioTrack);
        setProducer('screenAudioProducer', audioProducer);
      }

      // 공유가 중간에 중단되면 producer/track 정리
      videoProducer.on('trackended', () => {
        stopScreenProduce();
      });

      setMedia({ screenShareOn: true });
    } catch (error) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      stopScreenProduce();

      console.error('화면 공유 시작 실패:', error);
    } finally {
      setIsProducing('screen', false);
    }
  };

  const stopScreenProduce = () => {
    const { screenAudioProducer, screenVideoProducer } =
      useMeetingSocketStore.getState().producers;

    if (socket && screenVideoProducer) {
      screenVideoProducer.close();
      screenAudioProducer?.close();
      screenVideoProducer.track?.stop();
      screenAudioProducer?.track?.stop();
      setProducer('screenVideoProducer', null);
      setProducer('screenAudioProducer', null);
      setMedia({ screenShareOn: false });
    }
  };

  return {
    startAudioProduce,
    stopAudioProduce,
    startVideoProduce,
    stopVideoProduce,
    startScreenProduce,
    stopScreenProduce,
    isReady: !!helpers,
  };
};
