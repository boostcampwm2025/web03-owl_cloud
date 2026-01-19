import { Device, Producer, Transport } from 'mediasoup-client/types';

export type MediaPermission = 'unknown' | 'granted' | 'denied';

export interface MediaState {
  videoOn: boolean;
  audioOn: boolean;
  cameraPermission: MediaPermission;
  micPermission: MediaPermission;
}
export interface Producers {
  audioProducer: Producer | null;
  videoProducer: Producer | null;
  screenAudioProducer: Producer | null;
  screenVideoProducer: Producer | null;
}

export interface MediasoupTransports {
  device: Device;
  sendTransport: Transport;
  recvTransport: Transport;
}
