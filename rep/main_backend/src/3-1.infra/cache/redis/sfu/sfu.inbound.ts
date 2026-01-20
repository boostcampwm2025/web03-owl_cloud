import { SelectDataFromCache, SelectDatasFromCache } from '@app/ports/cache/cache.inbound';
import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import {
  CACHE_ROOM_INFO_KEY_NAME,
  CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME,
  CACHE_ROOM_NAMESPACE_NAME,
  CACHE_ROOM_SUB_NAMESPACE_NAME,
  CACHE_SFU_NAMESPACE_NAME,
  CACHE_SFU_PRODUCES_KEY_PROPS_NAME,
  CACHE_SFU_TRANSPORTS_KEY_NAME,
  CACHE_SFU_USER_KEY_NAME,
  REDIS_SERVER,
} from '../../cache.constants';
import { RoomTransportInfo } from '@app/sfu/queries/dto';
import {
  DisconnectUserTransportInfos,
  GetProducerProps,
  StopScreenProducerCacheInfoResult,
} from '@app/sfu/commands/dto';

@Injectable()
export class SelectSfuTransportDataFromRedis extends SelectDataFromCache<
  RedisClientType<any, any>
> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace(transport_id) 부분만 있고 keyname은 사용 안될 예정이다.
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<RoomTransportInfo | undefined> {
    const transportNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${namespace}`;

    const data = await this.cache.hGetAll(transportNamespace);

    // 값이 하나라도 없다면 문제가 있는 것이다.
    if (
      !data ||
      !data[CACHE_SFU_TRANSPORTS_KEY_NAME.SOCKET_ID] ||
      !data[CACHE_SFU_TRANSPORTS_KEY_NAME.USER_ID] ||
      !data[CACHE_SFU_TRANSPORTS_KEY_NAME.ROOM_ID] ||
      !data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE]
    )
      return undefined;

    // 이러한 형태가 아니라면 에러가 발생할것이니 여기서 잡는다.
    if (
      data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE] !== 'send' &&
      data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE] !== 'recv'
    )
      return undefined;

    return {
      socket_id: data[CACHE_SFU_TRANSPORTS_KEY_NAME.SOCKET_ID],
      user_id: data[CACHE_SFU_TRANSPORTS_KEY_NAME.USER_ID],
      room_id: data[CACHE_SFU_TRANSPORTS_KEY_NAME.ROOM_ID],
      type: data[CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE],
    };
  }
}

// user_id에 따라서 transport_id 알려주기

// user 정보를 찾기 위한 infra 함수
@Injectable()
export class SelectUserProducerDataFromRedis extends SelectDataFromCache<
  RedisClientType<any, any>
> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id:user_id 이다.
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: 'audio' | 'video';
  }): Promise<boolean> {
    const userProducerNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.PRODUCER_INFO}:${namespace}`;

    const userProducerData = await this.cache.hGet(userProducerNamespace, keyName);

    return userProducerData ? true : false;
  }
}

// main에서 정보를 찾기 위하 infra 함수
@Injectable()
export class SelectMainProducerDataFromRedis extends SelectDataFromCache<
  RedisClientType<any, any>
> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // 나중에 추가될 수 있으니 main에 추가되면 여기를 수정해주거나 추가해야 한다. namespace는 room_id이다.
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: 'screen_video' | 'screen_audio';
  }): Promise<boolean> {
    const roomNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${namespace}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    // 아마도 거의 audio 말고는 모두 main으로 갈것 같기는 하다.
    if (keyName === 'screen_audio') {
      const subData = await this.cache.hGet(roomNamespace, CACHE_ROOM_INFO_KEY_NAME.SUB_PRODUCER);
      return subData ? true : false;
    } else {
      const mainData = await this.cache.hGet(roomNamespace, CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER);
      return mainData ? true : false;
    }
  }
}

// 유저가 sfu에 transport 정보를 찾고 싶을때
@Injectable()
export class SelectUserTransportFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // user_id
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<DisconnectUserTransportInfos | undefined> {
    const userKey = `${CACHE_SFU_NAMESPACE_NAME.USER_INFO}:${namespace}`;

    const res = await this.cache.hGetAll(userKey);
    if (!res || Object.keys(res).length === 0) return undefined;

    const send = (res[CACHE_SFU_USER_KEY_NAME.SEND_TRANSPORT_ID] ?? '').trim();
    const recv = (res[CACHE_SFU_USER_KEY_NAME.RECV_TRANSPORT_ID] ?? '').trim();

    return {
      send_transport_id: send.length ? send : null,
      recv_transport_id: recv.length ? recv : null,
    };
  }
}

// consumer 정보를 가져오는 로직 구현
@Injectable()
export class SelectConsumerInfoFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id:user_id이고 keyName은 consumer_id 이다.
  async select({ namespace, keyName }: { namespace: string; keyName: string }): Promise<boolean> {
    const consumerNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.CONSUMER_INFO}:${namespace}`;

    const data = await this.cache.hGet(consumerNamespace, keyName);

    return data ? true : false;
  }
}

// consumers의 정보들을 보여주는 로직
@Injectable()
export class SelectConsumerInfosFromRedis extends SelectDatasFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id:user_id이고 keyNames은 consumer_ids 이다.
  async selectKeys({
    namespace,
    keyNames,
  }: {
    namespace: string;
    keyNames: Array<string>;
  }): Promise<Array<string>> {
    // consumer의 namespace 이름
    const consumerNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.CONSUMER_INFO}:${namespace}`;

    // cache에 해당 keynames가 존재하는지 확인
    const values = await this.cache.hmGet(consumerNamespace, keyNames);

    const consumerExisted: Array<string> = [];
    for (let i = 0; i < keyNames.length; i++) {
      if (values[i]) consumerExisted.push(keyNames[i]); // 값이 있으면 있고 없으면 null이기 때문에 이런식으로 처리
    }
    return consumerExisted;
  }
}

// user에 produce 정보를 가져오는 로직
@Injectable()
export class SelectUserProducerInfoDataFromRedis extends SelectDataFromCache<
  RedisClientType<any, any>
> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id:user_id 이다.
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: 'audio' | 'video';
  }): Promise<GetProducerProps | undefined> {
    const userProducerNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.PRODUCER_INFO}:${namespace}`;

    const userProducerData = await this.cache.hGet(userProducerNamespace, keyName);
    if (!userProducerData) return undefined;

    try {
      const parseData = JSON.parse(userProducerData);

      // 파싱 후 데이터 가져오기
      const producer_id: string = parseData[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID];
      const type: 'mic' | 'cam' = parseData[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE];
      const kind: 'audio' | 'video' = parseData[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.KIND];
      const status: 'on' | 'off' = parseData[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS];

      if (
        !producer_id ||
        (type !== 'mic' && type !== 'cam') ||
        (kind !== 'audio' && kind !== 'video') ||
        (status !== 'on' && status !== 'off')
      )
        return undefined;

      return {
        producer_id,
        type,
        kind,
        status,
      };
    } catch (err) {
      return undefined;
    }
  }
}

// user가 켜놓은 producer를 확인 -> 화면공유
@Injectable()
export class SelectRoomProducerDataFromRedis extends SelectDataFromCache<
  RedisClientType<any, any>
> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id, keyname은 user_id 이다.
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<StopScreenProducerCacheInfoResult> {
    const room_id: string = namespace;
    const user_id: string = keyName;

    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const res = await this.cache
      .multi()
      .hGet(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER)
      .hGet(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.SUB_PRODUCER)
      .exec();

    if (!res) return { main_producer_id: null, sub_producer_id: null };

    const [mainRaw, subRaw] = res as unknown as Array<string | null>;

    const main_producer_id: string | null = this.safeParseProducerInfo(mainRaw, user_id);
    const sub_producer_id: string | null = this.safeParseProducerInfo(subRaw, user_id);

    return { main_producer_id, sub_producer_id };
  }

  private safeParseProducerInfo(raw: string | null, owner_id: string): string | null {
    // 없는 경우
    if (!raw) return null;

    try {
      const obj = JSON.parse(raw);

      const user_id = obj?.[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID] ?? obj?.user_id;
      if (typeof user_id !== 'string' || user_id.length === 0 || user_id.trim() !== owner_id.trim())
        return null;

      return obj?.[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID] ?? null; // producer_id만 ( tool일 수 있음 그럴때는 스킵 )
    } catch (err) {
      return null;
    }
  }
}
