import { DtlsParameters, IceCandidate, IceParameters, Router } from "mediasoup/types";


// room_id에 대해서 worker, router, room_id, created_at으로 메모리에서 worker에서 router를 어떻게 관리하는지 작성한다. 
export type RoomEntry = {
  room_id : string;
  worker_idx : number; // 이 라우터를 운영하기 위해서 필요한 정보 
  worker_pid : number; // worker를 디버깅 하기 위해서 필요한 정보 
  router : Router; // 실질적으로 기능구현에 사용되는 라우터
  transport_ids : Set<string>; // transport들이 저장된 라우터 
  created_at : Date;
};

// transport에 대해서 정보를 저장한다. 
export type TransportEntry = {
  transportId: string;
  iceParameters: IceParameters;
  iceCandidates: Array<IceCandidate>;
  dtlsParameters: DtlsParameters;
};

export type ConnectTransportType = {
  room_id : string;
  socket_id : string; 
  user_id : string;
  type : "send" | "recv";
  transport_id : string;
  dtlsParameters: DtlsParameters
};