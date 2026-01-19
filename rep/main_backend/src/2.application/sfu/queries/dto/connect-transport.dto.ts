import { DtlsParameters } from 'mediasoup/types'; // 마찬가지 domain으로 빼야함

export type RoomTransportInfo = {
  room_id: string;
  socket_id: string;
  user_id: string;
  type: string;
};

export type ConnectTransportType = {
  room_id: string;
  socket_id: string;
  user_id: string;
  type: 'send' | 'recv';
  transport_id: string;
  dtlsParameters: DtlsParameters;
};
