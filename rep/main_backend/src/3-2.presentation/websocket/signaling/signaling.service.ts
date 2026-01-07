import { TokenDto } from "@app/auth/commands/dto";
import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import * as cookie from "cookie";
import { ConnectResult, ConnectRoomDto, DisconnectRoomDto } from "@app/room/commands/dto";
import { ConnectRoomUsecase, DisconnectRoomUsecase } from "@app/room/commands/usecase";
import { v7 as uuidV7 } from "uuid";
import { SocketPayload } from "./signaling.validate";
import { PayloadRes } from "@app/auth/queries/dto";
import { UnthorizedError } from "@error/application/user/user.error";


@Injectable()
export class SignalingWebsocketService {

  constructor(
    private readonly disconnectRoomUsecase : DisconnectRoomUsecase<any, any>,
    private readonly connectRoomUsecase : ConnectRoomUsecase<any, any>
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

    if ( !access_token && !refresh_token ) return undefined;
    if ( !access_token || !refresh_token ) throw new UnthorizedError("토큰이 존재하지 않습니다.");

    return {
      access_token, refresh_token
    };
  }

  private makeUserId() : string  {
    return uuidV7();
  }

  // ip를 파싱할때 사용하는 함수
  private extractClientIp(client : Socket) : string {
    // nginx가 클라이언트의 원 IP를 전달하기 위해서 만든 헤더이다. ( 즉 Nginx가 집적 걸어줌 )
    const forwarded = client.handshake.headers['x-forwarded-for'];

    // 프록시 환경일때는 이 ip를 신뢰 
    if ( typeof forwarded === "string" ) {
      return forwarded.split(",")[0].trim();
    }

    // 그렇지 않은경우 그냥 ip주소 사용
    return client.handshake.address;
  };

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

};