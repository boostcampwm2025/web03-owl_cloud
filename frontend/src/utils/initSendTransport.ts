import { Transport } from 'mediasoup-client/types';
import { Socket } from 'socket.io-client';

// sendTransport에 produce 핸들러를 바인딩하고,
export const initSendTransport = (socket: Socket, sendTransport: Transport) => {
  // 1) transport produce 이벤트 처리
  sendTransport.on(
    'produce',
    async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const type = appData?.type; // "mic" | "cam" | "screen_video" | "screen_audio"
        const resume = appData?.resume;

        const res = await socket.emitWithAck('signaling:ws:produce', {
          transport_id: sendTransport.id,
          kind,
          type,
          rtpParameters,
          resume
        });

        const id = res?.producerInfo?.producer_id ?? res?.producerInfo?.id;

        if (!id) {
          throw new Error('PRODUCE failed: missing producer id');
        }

        // mediasoup 자체 함수
        callback({ id });
      } catch (e) {
        errback(e instanceof Error ? e : new Error(String(e)));
      }
    },
  );
};
