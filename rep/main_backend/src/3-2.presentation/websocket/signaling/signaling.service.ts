import { TokenDto } from "@app/auth/commands/dto";
import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import * as cookie from "cookie";
import { ConnectResult, ConnectRoomDto, DisconnectRoomDto } from "@app/room/commands/dto";
import { ConnectRoomUsecase, DisconnectRoomUsecase } from "@app/room/commands/usecase";
import { v7 as uuidV7 } from "uuid";
import { DtlsHandshakeValidate, OnConsumeValidate, OnProduceValidate, ResumeConsumersValidate, SocketPayload } from "./signaling.validate";
import { PayloadRes } from "@app/auth/queries/dto";
import { SfuService } from "@present/webrtc/sfu/sfu.service";
import { NotConnectSignalling } from "@error/presentation/signalling/signalling.error";
import { CHANNEL_NAMESPACE } from "@infra/channel/channel.constants";
import { CreateConsumerDto, CreateConsumerResult, CreateProduceResult, CreatePropduceDto, CreateTransportDto, ResumeConsumerDto } from "@app/sfu/commands/dto";
import { ConnectTransportType } from "@app/sfu/queries/dto";
import { GetRoomMembersResult, MembersInfo } from "@app/room/queries/dto";
import { GetRoomMembersUsecase } from "@app/room/queries/usecase";


@Injectable()
export class SignalingWebsocketService {

  constructor(
    private readonly disconnectRoomUsecase : DisconnectRoomUsecase<any, any>,
    private readonly connectRoomUsecase : ConnectRoomUsecase<any, any>,
    private readonly getMembersUsecase : GetRoomMembersUsecase<any>,
    private readonly sfuServer : SfuService,
  ) {}

  parseJwtToken( client : Socket ) : TokenDto | undefined {

    // access_token 파싱
    let access_token : string | undefined;

    // body에 있는 access_token을 우선적으로 확인
    const tokenFromAuth = client.handshake.auth?.access_token;
    if (typeof tokenFromAuth === "string" && tokenFromAuth.trim()) {
      access_token = tokenFromAuth.trim();
    }

    const authHeader = client.handshake.headers.authorization;
    if ( typeof authHeader === "string" && authHeader.startsWith("Bearer ") ) {
      access_token = authHeader.slice(7).trim(); // Bearer 제거
    };

    // refresh_token 파싱
    let refresh_token : string | undefined;
    const cookieHeader : string | undefined = client.handshake.headers.cookie;
    if ( cookieHeader ) {
      const cookies = cookie.parse(cookieHeader);
      refresh_token = cookies["refresh_token"];
    };  

    if ( !access_token || !refresh_token ) return undefined;

    return {
      access_token, refresh_token
    };
  }

  private makeUserId() : string  {
    return uuidV7();
  }

  // ip를 파싱할때 사용하는 함수
  private extractClientIp(client : Socket) : string {
    
    // 아래에서 위조 될수 있으니 최우선은 이 ip를 기준으로 한다. 
    const realIp = client.handshake.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }

    // nginx가 클라이언트의 원 IP를 전달하기 위해서 만든 헤더이다. ( 즉 Nginx가 집적 걸어줌 )
    const forwarded = client.handshake.headers['x-forwarded-for'];

    // 프록시 환경일때는 이 ip를 신뢰 
    if ( typeof forwarded === "string" ) {
      return forwarded.split(",")[0].trim();
    }

    // 그렇지 않은경우 그냥 ip주소 사용
    return client.handshake.address;
  };

  makeRoomNamespace(room_id : string) : string {
    return `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`
  }

  makeSocketData({ payload, socket } : { payload : PayloadRes | undefined, socket : Socket }) : SocketPayload {
    if ( payload ) return {
      ...payload, ip : this.extractClientIp(socket), socket_id : socket.id, is_guest : false
    }
    else return {
      user_id : this.makeUserId(), nickname : "", ip : this.extractClientIp(socket), socket_id : socket.id, is_guest : true
    } 
  };

  // 방에 나갈때 사용하는 함수
  async disconnectRoomService(dto : DisconnectRoomDto) : Promise<void> {
    await this.disconnectRoomUsecase.execute(dto);
    this.sfuServer.disconnectUser(dto.user_id); // sfu 서버에 내용도 정리
  };

  // 방에 가입할때 사용하는 함수
  async joinRoomService( dto : ConnectRoomDto ) : Promise<ConnectResult> {
    try {
      const result : ConnectResult = await this.connectRoomUsecase.execute(dto);
      return result;
    } catch (err) {
      throw err;
    };
  };

  // sdp 협상에 필요한 함수 
  async sdpNegotiate( room_id : string ) {
    if ( !room_id || room_id === "" ) throw new NotConnectSignalling();
    const entry = await this.sfuServer.getOrCreateRoomRouter(room_id);
    return entry.router.rtpCapabilities; // sfu 서버에 codex 정보들 ( 나중에 변경 가능성 농후하다. )
  };

  // ice 협상을 위해 sfu서버에 ice parameter와 후보들을 알려준다 그리고 dtls 핸드세이킹을 위한 파라미터도 전달
  async iceNegotiate( client : Socket, type : "send" | "recv" ) {
    const room_id : string = client.data.room_id;
    const payload : SocketPayload = client.data.user;
    const dto : CreateTransportDto = {
      room_id,
      socket_id : payload.socket_id,
      user_id : payload.user_id,
      type,};
    if ( !room_id || room_id === "" ) throw new NotConnectSignalling();
    const transportOptions = await this.sfuServer.createTransPort(dto);
    return transportOptions;
  };

  // dtls 핸드 세이크를 위한 
  async dtlsHandshake( client: Socket, validate : DtlsHandshakeValidate) : Promise<void> {
    const room_id : string = client.data.room_id;
    const payload : SocketPayload = client.data.user;
    const dto : ConnectTransportType = {
      ...validate,
      room_id,
      socket_id : payload.socket_id,
      user_id : payload.user_id,
    }
    await this.sfuServer.connectTransport(dto);
  };

  // produce를 하기 위한 준비 
  async onProduce( client : Socket , validate : OnProduceValidate ) : Promise<CreateProduceResult & { nickname : string }> {
    const room_id : string = client.data.room_id;
    const payload : SocketPayload = client.data.user;
    const dto : CreatePropduceDto = {
      ...validate,
      room_id,
      ...payload
    };
    const result = await this.sfuServer.createProducer(dto);
    return {
      ...result, nickname : payload.nickname
    };
  };

  // consumer를 하기 위한 준비
  async onConsume( client : Socket, validate : OnConsumeValidate ) : Promise<CreateConsumerResult> {
    const room_id : string = client.data.room_id;
    const payload : SocketPayload = client.data.user;
    const dto : CreateConsumerDto = {
      ...validate,
      room_id,
      ...payload
    };
    return this.sfuServer.createConsumer(dto);
  };

  // consumer가 resume하게 하는 로직
  async resumeConsumer( client : Socket, validate : ResumeConsumersValidate ) : Promise<void> {
    const room_id : string = client.data.room_id;
    const payload : SocketPayload = client.data.user;
    const dto : ResumeConsumerDto = {
      ...payload,
      room_id,
      ...validate
    };
    await this.sfuServer.resumeConsumer(dto);
  };

  // 회의방에 모든 유저를 가져오고 싶을때 사용하는 로직 
  async getMemberData( client : Socket ) : Promise<GetRoomMembersResult> {
    const room_id : string = client.data.room_id;
    return this.getMembersUsecase.execute({room_id});
  };

  makeUserInfo(client : Socket) : MembersInfo {
    const payload : SocketPayload = client.data.user;
    return {
      ...payload,
      profile_path : null, // 이 부분은 좀 고민을 해야할 것 같다. 
      cam : null,
      mic : null
    }
  };

};