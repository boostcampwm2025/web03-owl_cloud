import { MediasoupTransports, Producers } from '@/types/media';
import { initSendTransport } from '@/utils/initSendTransport';
import { Device } from 'mediasoup-client';
import { Producer, Transport } from 'mediasoup-client/types';
import { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface MeetingSocketState {
  socket: Socket | null;
  device: Device | null;
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  producers: Producers;
}

interface MeetingSocketAction {
  setSocket: (socket: Socket | null) => void;

  setMediasoupTransports: (
    socket: Socket,
    transports: MediasoupTransports,
  ) => void;

  setProducer: (type: keyof Producers, producer: Producer | null) => void;
}

export const useMeetingSocketStore = create<
  MeetingSocketState & MeetingSocketAction
>((set) => ({
  socket: null,
  device: null,
  sendTransport: null,
  recvTransport: null,

  producers: {
    audioProducer: null,
    videoProducer: null,
    screenAudioProducer: null,
    screenVideoProducer: null,
  },

  setSocket: (socket) => set({ socket }),
  setMediasoupTransports: (socket, transports) => {
    initSendTransport(socket, transports.sendTransport);
    set({ ...transports });
  },
  setProducer: (type, producer) =>
    set((prev) => ({ producers: { ...prev.producers, [type]: producer } })),
}));
