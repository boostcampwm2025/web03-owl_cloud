import { Injectable } from "@nestjs/common";
import { CreateTransportDto, RoomEntry, TransportEntry } from "@app/sfu/commands/dto";
import { CreateRouterUsecase, CreateTransportUsecase } from "@app/sfu/commands/usecase";
import { RoomRouterRepository, TransportRepository } from "@infra/memory/sfu";
import { ConnectTransportUsecase } from "@app/sfu/queries/usecase";
import { ConnectTransportType } from "@app/sfu/queries/dto";


@Injectable()
export class SfuService {
  
  constructor(
    // usecase
    private readonly createRouterUsecase : CreateRouterUsecase,
    private readonly createTransportUsecase : CreateTransportUsecase<any>,
    private readonly connectTransportUsecase : ConnectTransportUsecase<any>,
    // infra
    private readonly roomRouters : RoomRouterRepository,
    private readonly transports : TransportRepository,
  ) {}

  // 1. router 생성 관련 함수 -> 생성 혹은 얻는 이유는 방을 만들었다고 무조건 router를 부여하면 비어있는 방에 낭비가 심할 수 있기에 들어와야 활성화가 된다. 
  async getOrCreateRoomRouter(room_id : string) : Promise<RoomEntry> {
    return this.createRouterUsecase.execute(room_id);
  };

  // 방이 닫혔을때 로직도 구현해두자
  closeRoomRouter(room_id : string) : void {
    const entry = this.roomRouters.get(room_id);
    if ( !entry ) return;

    // transport를 관리
    for (const transport_id of entry.transport_ids) {
      const t = this.transports.get(transport_id);
      if (t && !t.closed) {
        try { t.close(); } catch {}
      }
      this.transports.delete(transport_id);
    };

    try {
      if (!entry.router.closed) entry.router.close();
    } finally {
      this.roomRouters.delete(room_id); // 근데 생각해보면 close를 해두어서 삭제되기는 할거다. 
    };
  };  

  // 2. transport 부분 생성 ( 나중에 전체적인 부분 usecase로 빼자고 )
  async createTransPort(dto : CreateTransportDto) : Promise<TransportEntry> {
    return this.createTransportUsecase.execute(dto);
  };

  // 3. transport connect 연결 ( 이때 부터는 이제 sfu와 webrtc 통신이 가능해졌다고 생각하면 된다. )
  async connectTransport(dto : ConnectTransportType) : Promise<void> {
    await this.connectTransportUsecase.execute(dto);
  };

};