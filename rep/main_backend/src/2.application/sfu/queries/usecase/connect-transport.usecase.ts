import { Injectable } from "@nestjs/common";
import type { TransportRepositoryPort } from "../../ports";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { ConnectTransportType, RoomTransportInfo } from "../dto";
import { SfuErrorMessage } from "@error/application/sfu/sfu.error";


@Injectable()
export class ConnectTransportUsecase<T> {

  constructor(
    private readonly transportRepo: TransportRepositoryPort,
    private readonly selectSfuTransportInfoFromRedis : SelectDataFromCache<T>
  ) {}

  async execute( dto : ConnectTransportType ) {

    // 1. transport에 정합성에 대해서 검증
    const transportInfo : RoomTransportInfo | undefined = await this.selectSfuTransportInfoFromRedis.select({ namespace : dto.transport_id, keyName : "" });
    if ( !transportInfo ) throw new SfuErrorMessage("transport_id를 다시 확인해주세요. - 데이터 찾는데 문제 발생");
    
    if ( dto.room_id !== transportInfo.room_id || dto.socket_id !== transportInfo.socket_id || dto.type !== transportInfo.type || dto.user_id !== transportInfo.user_id ) throw new SfuErrorMessage("잘못된 transport_id에 연결하고자 합니다 다시 확인해주시길 바랍니다.");

    // 2. transport 가져온 후 연결
    const transport = this.transportRepo.get(dto.transport_id);
    if ( !transport ) throw new SfuErrorMessage("transport_id를 다시 확인해주세요.");

    await transport.connect({ dtlsParameters : dto.dtlsParameters });
  };
};