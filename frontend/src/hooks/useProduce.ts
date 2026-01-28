import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { createProduceHelper } from '@/utils/createProduceHelpers';
import { processAudioTrack, stopNoiseSuppressor } from '@/utils/noiseFilter';
import { useMemo } from 'react';

export const useProduce = () => {
  // device를 가져오도록 수정했습니다.
  const { socket, sendTransport, setProducer, setIsProducing, device } =
    useMeetingSocketStore();
  const { setMedia } = useMeetingStore();

  // sendTransport가 초기화 된 이후 createProduceHelper 선언
  const helpers = useMemo(() => {
    if (!socket || !sendTransport || !device) return null;
    return createProduceHelper(sendTransport, device);
  }, [sendTransport, device]);

  const startAudioProduce = async () => {
    // 함수가 호출되었을 시점의 값을 위해 getState() 사용
    const { isProducing } = useMeetingSocketStore.getState();

    // 이미 Producer가 있거나, 현재 생성 중이라면(strictMode로 인한 2번 호출 방지) 리턴
    if (!helpers || isProducing.audio) {
      return;
    }

    try {
      // audio produce에 대한 락 설정
      setIsProducing('audio', true);

      const constraints = {
        echoCancellation: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: constraints,
      });
      const audioTrack = stream.getAudioTracks()[0];
      const filteredAudioTrack = await processAudioTrack(audioTrack);

      const audioProducer = await helpers.produceMic(filteredAudioTrack);
      setProducer('audioProducer', audioProducer);
      setMedia({ audioOn: true });

      // 중간에 연결이 끊겼을 때의 핸들링
      audioProducer.on('trackended', () => {
        stopAudioProduce();
        stopNoiseSuppressor();
      });
    } catch (error) {
      console.error('마이크 시작 실패:', error);
      stopNoiseSuppressor();
    } finally {
      // 락 해제
      setIsProducing('audio', false);
    }
  };

  const stopAudioProduce = () => {
    const { audioProducer } = useMeetingSocketStore.getState().producers;

    if (socket && audioProducer) {
      // 서버에 OFF 신호 전달
      socket.emit('signaling:ws:produce_off', {
        producer_id: audioProducer.id,
        kind: 'audio',
      });
      setMedia({ audioOn: false });
    }
  };

  const startVideoProduce = async () => {
    const { isProducing } = useMeetingSocketStore.getState();
    if (!helpers || isProducing.video) {
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
        kind: 'video',
      });
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

      // screen에 경우는 video의 설정을 적어서 보내준다. 
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate : { max : 15 }, // 이건 고정하는게 좋다. 
          width : { max : 1280 }, // 이부분은 나중에 회의실 등 상황에 따라서 조정이 가능하다 ( 이거 보다 크면 다운스케일 적용 회의 방이나 분위기에 따라 다름 ) 
          height : { max : 720 } // 마찬 가지 
        },
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
      socket.emit('signaling:ws:screen_stop', () => {
        screenVideoProducer.close();
        screenAudioProducer?.close();
        screenVideoProducer.track?.stop();
        screenAudioProducer?.track?.stop();

        setProducer('screenVideoProducer', null);
        setProducer('screenAudioProducer', null);
        setMedia({ screenShareOn: false });
      });
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
