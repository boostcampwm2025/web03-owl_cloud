import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { RtpParameters, DtlsParameters, RtpCapabilities } from 'mediasoup/types';

// socket에서 사용할
export type SocketPayload = {
  socket_id: string;
  ip: string;
  user_id: string;
  nickname: string;
  access_token?: string;
  is_guest: boolean;
};

// 처음에 방에 가입할때 필요한 정보
export class JoinRoomValidate {
  @IsNotEmpty()
  @IsString()
  @MinLength(32)
  @MaxLength(32)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(16) // 16글자로 정리 가능
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16) // 16글자?
  nickname?: string;
}

export class NegotiateIceValidate {
  @IsNotEmpty()
  @IsIn(['send', 'recv'])
  type: 'send' | 'recv';
}

export class DtlsHandshakeValidate {
  @IsNotEmpty()
  @IsString()
  transport_id: string;

  @IsNotEmpty()
  @IsObject()
  dtlsParameters: DtlsParameters;

  @IsNotEmpty()
  @IsIn(['send', 'recv'])
  type: 'send' | 'recv';
}

// 배포할때 사용하는 validate
export class OnProduceValidate {
  // 내가 사용하는 produce용 transport_id를 보내야 한다.
  @IsNotEmpty()
  @IsString()
  transport_id: string;

  @IsString()
  @IsIn(['audio', 'video'])
  kind: 'audio' | 'video';

  // 같은 kind에도 이제 차이를 두어야 한다. ( screen 같은 경우는 main 레벨로 올려야 함 )
  @IsString()
  @IsIn(['mic', 'cam', 'screen_video', 'screen_audio'])
  type: 'mic' | 'cam' | 'screen_video' | 'screen_audio';

  @IsNotEmpty()
  @IsObject()
  rtpParameters: RtpParameters;
}

// 구독할때 사용하는 validate
export class OnConsumeValidate {
  // 내가 consume을 위해서 연결해 놓은 transport_id
  @IsNotEmpty()
  @IsString()
  transport_id: string;

  // target이 되는 producer
  @IsNotEmpty()
  @IsString()
  producer_id: string;

  // 내가 사용할수 있는 rtp 파라미터들
  @IsNotEmpty()
  @IsObject()
  rtpCapabilities: RtpCapabilities;

  // 원하는 타입이 뭔지 알려줘여 한다.
  @IsNotEmpty()
  @IsIn(['user', 'main'])
  status: 'user' | 'main';
}

// resume에 쓰이는 consume validate
export class ResumeConsumerValidate {
  @IsNotEmpty()
  @IsString()
  consumer_id: string;
}

export class pauseConsumerValidate {
  @IsNotEmpty()
  @IsString()
  consumer_id: string;
}

// 여러개를 구독할때 사용
export class ProducerInfoValidate {
  @IsNotEmpty()
  @IsString()
  producer_id: string;

  @IsNotEmpty()
  @IsObject()
  rtpCapabilities: RtpCapabilities;

  @IsNotEmpty()
  @IsIn(['user', 'main'])
  status: 'user' | 'main';
}
export class OnConsumesValidate {
  @IsNotEmpty()
  @IsString()
  transport_id: string;

  @ArrayMinSize(1) // 최소 1개는 받겠다
  @ValidateNested({ each: true })
  @Type(() => ProducerInfoValidate)
  producer_infos: ProducerInfoValidate[];
}

// 여러개의 consumer_ids를 검증
export class ResumeConsumersValidate {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  consumer_ids: Array<string>;
}

export class PauseConsumersValidate {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  consumer_ids: Array<string>;
}

export class ConnectToolTypeValidate {
  @IsNotEmpty()
  @IsIn(['whiteboard', 'codeeditor'])
  tool: 'whiteboard' | 'codeeditor';
}

export const TOOL_LEFT_TOPIC_NAME = Symbol('TOOL_LEFT_TOPIC_NAME');

export class DisConnectToolTypeValidate {
  @IsNotEmpty()
  @IsIn(['whiteboard', 'codeeditor'])
  tool: 'whiteboard' | 'codeeditor';
}

// producer를 다시 활성화 하기 위한 validate
export class resumeProducerValidate {
  @IsNotEmpty()
  @IsString()
  producer_id: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['audio', 'video'])
  kind: 'audio' | 'video';
}

// producer를 멈추기 위한 validate
export class PauseProducerValidate {
  @IsNotEmpty()
  @IsString()
  producer_id: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['audio', 'video'])
  kind: 'audio' | 'video';
}

export class UploadFileValidate {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Matches(/^[^\\\/\0]+$/)
  filename: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  @Matches(/^[\w.+-]+\/[\w.+-]+$/)
  mime_type: string;

  @IsNotEmpty()
  @IsIn(['image', 'video', 'audio', 'text', 'binary'])
  category: 'image' | 'video' | 'audio' | 'text' | 'binary';

  @IsInt()
  @Min(1)
  @Max(100 * 1024 * 1024)
  size: number;
}

export class CheckUploadFileDirectPropsValidate {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[^\s]+$/)
  etag!: string;
}

export class CheckUploadFileMultipartSubPropsValidate {
  @IsInt()
  @Min(1)
  part_number!: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[^\s]+$/)
  etag!: string;
}

export class CheckUploadFileMultipartPropsValidate {
  @IsNotEmpty()
  @IsString()
  upload_id!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckUploadFileMultipartSubPropsValidate)
  tags!: CheckUploadFileMultipartSubPropsValidate[];
}

export class CheckFileValidate {
  @IsNotEmpty()
  @IsString()
  file_id!: string;

  @IsNotEmpty()
  @IsIn(['direct', 'multipart'])
  type!: 'direct' | 'multipart';

  @ValidateIf((o) => o.type === 'direct')
  @IsDefined() // direct면 아래 검증이 있음
  @ValidateNested()
  @Type(() => CheckUploadFileDirectPropsValidate)
  direct!: CheckUploadFileDirectPropsValidate;

  @ValidateIf((o) => o.type === 'multipart')
  @IsDefined() // multipart면 아래 검증이 있음
  @ValidateNested()
  @Type(() => CheckUploadFileMultipartPropsValidate)
  multipart!: CheckUploadFileMultipartPropsValidate;
}

export type MessageResultProps = {
  type: 'message' | 'file';
  message: string | undefined; // message가 들어간다.
  filename?: string;
  size?: number;
  category?: 'audio' | 'video' | 'image' | 'text' | 'binary';
  thumbnail_url?: string | undefined;
  file_id?: string;
  nickname: string;
  user_id: string;
};

export class DownloadFileValidate {
  @IsNotEmpty()
  @IsString()
  file_id: string;
}

export class SendMessageValidate {
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}
