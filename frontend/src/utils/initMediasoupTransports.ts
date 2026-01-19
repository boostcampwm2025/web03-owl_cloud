import * as mediasoupClient from 'mediasoup-client';
import { Transport } from 'mediasoup-client/types';
import { Socket } from 'socket.io-client';

// 아래 함수에 socket을 대입해서 나오는 device, sendTransport, recvTransport를 사용하시면 됩니다.
export async function initMediasoupTransports(socket: Socket) {
  // 1) NEGOTIATE_SDP: router rtpCapabilities 받기
  const sdpRes = await socket.emitWithAck('signaling:ws:negotiate_sdp');
  if (!sdpRes?.rtpCapabilities) {
    throw new Error('NEGOTIATE_SDP failed: missing rtpCapabilities');
  }

  // 2) Device 준비
  const device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities: sdpRes.rtpCapabilities });

  // 3) NEGOTIATE_ICE (send)
  const sendRes = await socket.emitWithAck('signaling:ws:negotiate_ice', {
    type: 'send',
  });
  if (!sendRes?.transportOptions) {
    throw new Error('NEGOTIATE_ICE(send) failed: missing transportOptions');
  }
  // 서버 Response와 Mediasoup의 타입 일치
  const { transportId: sendId, ...sendRest } = sendRes.transportOptions;
  const sendTransport = device.createSendTransport({ id: sendId, ...sendRest });

  // 4) NEGOTIATE_ICE (recv)
  const recvRes = await socket.emitWithAck('signaling:ws:negotiate_ice', {
    type: 'recv',
  });
  if (!recvRes?.transportOptions) {
    throw new Error('NEGOTIATE_ICE(recv) failed: missing transportOptions');
  }
  // 서버 Response와 Mediasoup의 타입 일치
  const { transportId: recvId, ...recvRest } = sendRes.transportOptions;
  const recvTransport = device.createRecvTransport({ id: recvId, ...recvRest });

  // 5) DTLS_HANDSHAKE 연결 핸들러 공통 함수
  const bindDtlsHandshake = (transport: Transport, type: 'send' | 'recv') => {
    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socket.emitWithAck('signaling:ws:dtls_handshake', {
          type,
          transport_id: transport.id,
          dtlsParameters,
        });
        callback();
      } catch (e) {
        if (e instanceof Error) {
          errback(e);
        } else {
          errback(new Error(String(e)));
        }
      }
    });
  };

  bindDtlsHandshake(sendTransport, 'send');
  bindDtlsHandshake(recvTransport, 'recv');

  return { device, sendTransport, recvTransport };
}
