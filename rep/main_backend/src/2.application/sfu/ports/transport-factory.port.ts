import type { Router, WebRtcTransport } from 'mediasoup/types';

export interface TransportFactoryPort {
  createWebRtcTransport(router: Router): Promise<WebRtcTransport>;
  attachDebugHooks(roomId: string, transport: WebRtcTransport): void;
}
