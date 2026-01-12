import type { WebRtcTransport } from "mediasoup/types"; // 나중에 domain으로 빼야하


export interface TransportRepositoryPort {
  get(id: string): WebRtcTransport | undefined;
  set(id: string, transport: WebRtcTransport): void;
  delete(id: string): void;
}
