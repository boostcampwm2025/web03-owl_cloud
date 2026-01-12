import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_SFU_NAMESPACE_NAME, CACHE_SFU_TRANSPORTS_KEY_NAME, REDIS_SERVER } from "../../cache.constants";
import { RoomTransportInfo } from "@app/sfu/queries/dto";


@Injectable()
export class SelectSfuTransportDataFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>,
  ) { super(cache); };  

  // namespace 부분만 있고 keyname은 사용 안될 예정이다.
  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<RoomTransportInfo | undefined> {

    const transportNamespace : string = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${namespace}`;

    const data = await this.cache.hGetAll(transportNamespace);

    // 값이 하나라도 없다면 문제가 있는 것이다. 
    if ( !data || !data[CACHE_SFU_TRANSPORTS_KEY_NAME.SOCKET_ID] || !data[CACHE_SFU_TRANSPORTS_KEY_NAME.USER_ID] || !data[CACHE_SFU_TRANSPORTS_KEY_NAME.ROOM_ID] || !data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE]  ) return undefined;


    // 이러한 형태가 아니라면 에러가 발생할것이니 여기서 잡는다.
    if (data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE] !== "send" && data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE] !== "recv") return undefined;

    return {
      socket_id : data[CACHE_SFU_TRANSPORTS_KEY_NAME.SOCKET_ID],
      user_id : data[CACHE_SFU_TRANSPORTS_KEY_NAME.USER_ID],
      room_id : data[CACHE_SFU_TRANSPORTS_KEY_NAME.ROOM_ID],
      type : data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE]
    }
  }
};