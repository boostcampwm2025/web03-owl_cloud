import { DtlsParameters, IceCandidate, IceParameters } from "mediasoup/types"; // 나중에 domain으로 빼야 함


export type TransportEntry = {
  transportId: string;
  iceParameters: IceParameters;
  iceCandidates: Array<IceCandidate>;
  dtlsParameters: DtlsParameters;
};

export type CreateTransportDto = {
  room_id : string;
  socket_id : string; 
  user_id : string;
  type : "send" | "recv"
};

export type CreateRoomTransportDto = {
  room_id : string;
  socket_id : string;
  transport_id : string;
  user_id : string;
  type : "send" | "recv"
};