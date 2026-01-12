import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import type { RtpParameters, DtlsParameters, RtpCapabilities } from "mediasoup/types";


// socket에서 사용할 
export type SocketPayload = {
  socket_id : string;
  ip : string;
  user_id : string;
  nickname : string;
  access_token? : string;
  is_guest : boolean;
};

// 처음에 방에 가입할때 필요한 정보
export class JoinRoomValidate {

  @IsNotEmpty()
  @IsString()
  @MinLength(32)
  @MaxLength(32)
  code : string;

  @IsOptional()
  @IsString()
  @MaxLength(16) // 16글자로 정리 가능
  password? : string;

  @IsOptional()
  @IsString()
  @MaxLength(16) // 16글자? 
  nickname? : string;
}

export class NegotiateIceValidate {
  @IsNotEmpty()
  @IsIn([ "send", "recv" ])
  type : "send" | "recv"
};  

export class DtlsHandshakeValidate {

  @IsNotEmpty()
  @IsString()
  transport_id : string;

  @IsNotEmpty()
  @IsObject()
  dtlsParameters: DtlsParameters;

  @IsNotEmpty()
  @IsIn([ "send", "recv" ])
  type : "send" | "recv";
};

// 배포할때 사용하는 validate
export class OnProduceValidate {

  // 내가 사용하는 produce용 transport_id를 보내야 한다. 
  @IsNotEmpty()
  @IsString()
  transport_id: string;

  @IsString()
  @IsIn(["audio", "video"])
  kind: "audio" | "video";

  // 같은 kind에도 이제 차이를 두어야 한다. ( screen 같은 경우는 main 레벨로 올려야 함 )
  @IsString()
  @IsIn(["mic", "cam", "screen_video", "screen_audio"])
  type : "mic" | "cam" | "screen_video" | "screen_audio"

  @IsNotEmpty()
  @IsObject()
  rtpParameters: RtpParameters;

};

// 구독할때 사용하는 validate
export class OnConsumeValidate {

  // 내가 consume을 위해서 연결해 놓은 transport_id
  @IsNotEmpty()
  @IsString()
  transport_id: string;

  // target이 되는 producer
  @IsNotEmpty()
  @IsString()
  producer_id : string;

  // 내가 사용할수 있는 rtp 파라미터들
  @IsNotEmpty()
  @IsObject()
  rtpCapabilities: RtpCapabilities;

  // 원하는 타입이 뭔지 알려줘여 한다. 
  @IsNotEmpty()
  @IsIn([ "user", "main" ])
  status : "user" | "main";
};  

// resume에 쓰이는 consume validate
export class ResumeConsumersValidate {

  @IsNotEmpty()
  @IsString()
  consumer_id : string;

};