import { ProducerInfo } from '@/types/meeting';
import { Device } from 'mediasoup-client';
import { Transport } from 'mediasoup-client/types';
import { Socket } from 'socket.io-client';

interface CreateConsumeHelpersProps {
  socket: Socket;
  device: Device;
  recvTransport: Transport;
}

export function createConsumeHelpers({
  socket,
  device,
  recvTransport,
}: CreateConsumeHelpersProps) {
  /**
   * producer 1개 구독
   * - consume 요청
   * - recvTransport.consume()
   * - resume 요청
   * - audio/video element에 연결까지 수행
   */
  const consumeOne = async (producerInfo: ProducerInfo) => {
    // 1) 서버에 consume 요청
    const { consumerInfo } = await socket.emitWithAck('signaling:ws:consume', {
      transport_id: recvTransport.id,
      producer_id: producerInfo.producer_id,
      rtpCapabilities: device.rtpCapabilities,
      status: producerInfo.status, // "user" | "main"
    });

    if (!consumerInfo) throw new Error('CONSUME failed: missing consumerInfo');

    // 2) mediasoup-client consumer 생성
    const consumer = await recvTransport.consume({
      id: consumerInfo.consumer_id,
      producerId: consumerInfo.producer_id,
      kind: consumerInfo.kind,
      rtpParameters: consumerInfo.rtpParameters,
      appData: {
        user_id: consumerInfo.user_id,
        type: consumerInfo.type,
        status: consumerInfo.status,
      },
    });

    // 3) 서버에 resume 요청 (패킷 수신 시작)
    await socket.emitWithAck('signaling:ws:resume', {
      consumer_id: consumer.id,
    });

    // 4) 엘리먼트 연결
    const stream = new MediaStream([consumer.track]);

    return { consumer, stream };
  };

  return { consumeOne };
}
