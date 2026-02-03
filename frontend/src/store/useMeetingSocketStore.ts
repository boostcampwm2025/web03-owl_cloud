import { IsProducing, MediasoupTransports, Producers } from '@/types/meeting';
import { initSendTransport } from '@/utils/initSendTransport';
import { Device } from 'mediasoup-client';
import { Consumer, Producer, Transport } from 'mediasoup-client/types';
import { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface MeetingSocketState {
  socket: Socket | null;
  device: Device | null;
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  producers: Producers;
  isProducing: IsProducing;
  consumers: Record<string, Consumer>;
  camStream: MediaStream | null; // cam에 stream
}

interface MeetingSocketAction {
  setSocket: (socket: Socket | null) => void;
  setMediasoupTransports: (
    socket: Socket,
    transports: MediasoupTransports,
  ) => void;
  setProducer: (type: keyof Producers, producer: Producer | null) => void;
  setIsProducing: (type: keyof IsProducing, state: boolean) => void;
  addConsumer: (producerId: string, consumer: Consumer) => void;
  addConsumers: (
    consumers: { producerId: string; consumer: Consumer }[],
  ) => void;
  removeConsumer: (producerId: string) => void;
  setCamStream: (stream: MediaStream | null) => void;
  stopCamStream : () => void;
}

export const useMeetingSocketStore = create<
  MeetingSocketState & MeetingSocketAction
>((set, get) => ({
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

  isProducing: { audio: false, video: false, screen: false },

  consumers: {},

  camStream: null,

  setSocket: (socket) => set({ socket }),
  setMediasoupTransports: (socket, transports) => {
    initSendTransport(socket, transports.sendTransport);
    set({ ...transports });
  },
  setProducer: (type, producer) =>
    set((prev) => ({ producers: { ...prev.producers, [type]: producer } })),
  setIsProducing: (type, state) =>
    set((prev) => ({ isProducing: { ...prev.isProducing, [type]: state } })),

  addConsumer: (producerId, consumer) =>
    set((prev) => ({
      consumers: {
        ...prev.consumers,
        [producerId]: consumer,
      },
    })),
  addConsumers: (newConsumerList) =>
    set((prev) => {
      const nextConsumers = { ...prev.consumers };

      newConsumerList.forEach(({ producerId, consumer }) => {
        nextConsumers[producerId] = consumer;
      });

      return {
        consumers: nextConsumers,
      };
    }),
  removeConsumer: (producerId) =>
    set((prev) => {
      const targetConsumer = prev.consumers[producerId];

      if (targetConsumer) {
        targetConsumer.close();
      }

      const { [producerId]: _, ...remainingConsumers } = prev.consumers;

      return {
        consumers: remainingConsumers,
      };
    }),

  setCamStream: (stream) => {
    const prev = get().camStream;
    if (prev && prev !== stream) {
      prev.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    }
    set({ camStream: stream });
  },

  stopCamStream: () => {
    const stream = get().camStream;
    if (stream) {
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    }
    set({ camStream: null });
  },  
}));
