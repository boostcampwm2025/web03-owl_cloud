import { RtpParameters } from "mediasoup/types";


export type CreatePropduceDto = {
  transport_id: string;
  room_id : string;
  socket_id : string;
  user_id : string;
  kind: "audio" | "video";
  type : "mic" | "cam" | "screen_video" | "screen_audio"
  rtpParameters: RtpParameters;
};