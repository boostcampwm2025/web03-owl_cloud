import { DeleteDataToCache, InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_ROOM_INFO_KEY_NAME, CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME, CACHE_ROOM_NAMESPACE_NAME, CACHE_ROOM_SUB_NAMESPACE_NAME, CACHE_SFU_NAMESPACE_NAME, CACHE_SFU_PRODUCES_KEY_PROPS_NAME, CACHE_SFU_TRANSPORTS_KEY_NAME, REDIS_SERVER } from "../../cache.constants";
import { CreateRoomTransportDto, InsertProducerDto } from "@app/sfu/commands/dto";


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

// user에 개인 producer 정보를 저장
@Injectable()
export class InsertUserProducerDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache: RedisClientType<any, any>,
  ) { super(cache); }

  async insert(entity: InsertProducerDto): Promise<boolean> {

    const userProducerNamespace : string = `${CACHE_SFU_NAMESPACE_NAME.PRODUCER_INFO}:${entity.room_id}:${entity.user_id}`.trim();

    if (entity.type !== "cam" && entity.type !== "mic") return false;

    try {
      const data = {
        [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID] : entity.producer_id,
        [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE] : entity.type,
        [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.KIND] : entity.kind
      }
      // 중복 방지용 함수
      const ok = await this.cache.hSetNX(userProducerNamespace, entity.kind, JSON.stringify(data));

      return ok === 1;
    } catch (err) {
      return false;
    };
  };
};

@Injectable()
export class InsertMainProducerDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache: RedisClientType<any, any>,
  ) { super(cache); }

  // main에 producer 정보를 저장한다. 
  async insert(entity: InsertProducerDto): Promise<boolean> {
    
    const mainNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`.trim();

    if ( entity.type === "cam" || entity.type === "mic" ) return false;

    try {
      const data = {
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID] : entity.producer_id,
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE] : entity.type,
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND] : entity.kind,
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID] : entity.user_id
      };
      // 중복 방지용 함수
      const keyName : string = entity.type === "screen_audio" ? CACHE_ROOM_INFO_KEY_NAME.SUB_PRODUCER : CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER;
 
      const ok = await this.cache.hSetNX(mainNamespace, keyName, JSON.stringify(data));

      return ok === 1;
    } catch (err) {
      return false;
    };

  }
};