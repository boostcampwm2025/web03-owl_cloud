import { DeleteDataToCache, InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_SFU_NAMESPACE_NAME, CACHE_SFU_TRANSPORTS_KEY_NAME, REDIS_SERVER } from "../../cache.constants";
import { CreateRoomTransportDto } from "@app/sfu/commands/dto";



@Injectable()
export class CreateSfuTransportInfoToRedis extends InsertDataToCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>,
  ) { super(cache); };

  async insert(entity: CreateRoomTransportDto): Promise<boolean> {

    const namespace : string = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${entity.transport_id}`; 

    await this.cache.hSet(namespace, {
      [CACHE_SFU_TRANSPORTS_KEY_NAME.ROOM_ID] : entity.room_id,
      [CACHE_SFU_TRANSPORTS_KEY_NAME.SOCKET_ID] : entity.socket_id,
      [CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE] : entity.type,
      [CACHE_SFU_TRANSPORTS_KEY_NAME.USER_ID] : entity.user_id
    });

    return true;
  };
};  

@Injectable()
export class DeleteSfuTransportInfoToRedis extends DeleteDataToCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>,
  ) { super(cache); };

  // namespace는 해당 transport_id에 대해서 삭제이다. -> 잘 봐주어야 함
  async deleteNamespace(namespace: string): Promise<boolean> {
    // 문자 검증? 이것도 필요해 보인다. 
    const transportNamespace : string = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${namespace}`;

    await this.cache.del(transportNamespace);

    return true;
  }

};