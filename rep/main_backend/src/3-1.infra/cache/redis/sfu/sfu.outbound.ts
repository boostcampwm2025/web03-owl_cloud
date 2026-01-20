import {
  DeleteDataToCache,
  InsertDataToCache,
  UpdateDataToCache,
} from '@app/ports/cache/cache.outbound';
import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import {
  CACHE_ROOM_INFO_KEY_NAME,
  CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME,
  CACHE_ROOM_NAMESPACE_NAME,
  CACHE_ROOM_SUB_NAMESPACE_NAME,
  CACHE_SFU_CONSUMER_KEY_PROPS_NAME,
  CACHE_SFU_NAMESPACE_NAME,
  CACHE_SFU_PRODUCES_KEY_PROPS_NAME,
  CACHE_SFU_TRANSPORTS_KEY_NAME,
  CACHE_SFU_USER_KEY_NAME,
  REDIS_SERVER,
} from '../../cache.constants';
import {
  CreateRoomTransportDto,
  InsertConsumerDataDto,
  InsertConsumerDatasDto,
  InsertProducerDto,
} from '@app/sfu/commands/dto';

@Injectable()
export class CreateSfuTransportInfoToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: CreateRoomTransportDto): Promise<boolean> {
    const infoKey = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${entity.transport_id}`;
    const userKey = `${CACHE_SFU_NAMESPACE_NAME.USER_INFO}:${entity.user_id}`;
    const typeField =
      entity.type === 'send'
        ? CACHE_SFU_USER_KEY_NAME.SEND_TRANSPORT_ID
        : CACHE_SFU_USER_KEY_NAME.RECV_TRANSPORT_ID;

    const tx = this.cache.multi();

    tx.hSetNX(userKey, typeField, entity.transport_id);

    tx.hSet(infoKey, {
      [CACHE_SFU_TRANSPORTS_KEY_NAME.ROOM_ID]: entity.room_id,
      [CACHE_SFU_TRANSPORTS_KEY_NAME.SOCKET_ID]: entity.socket_id,
      [CACHE_SFU_TRANSPORTS_KEY_NAME.TYPE]: entity.type,
      [CACHE_SFU_TRANSPORTS_KEY_NAME.USER_ID]: entity.user_id,
    });

    let result: [number, number] | null;
    try {
      result = (await tx.exec()) as unknown as [number, number] | null;
    } catch (err) {
      return false;
    }
    if (!result) return false;

    const [hsetnxRes] = result as unknown as [number, number];

    // 유저 정보가 저장했는지 확인
    if (hsetnxRes !== 1) {
      await this.cache.del(infoKey).catch(() => {});
      return false;
    }

    return true;
  }
}

@Injectable()
export class DeleteSfuTransportInfoToRedis extends DeleteDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 해당 transport_id에 대해서 삭제이다. -> 잘 봐주어야 함
  async deleteNamespace(namespace: string): Promise<boolean> {
    // 문자 검증? 이것도 필요해 보인다.
    const transportNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${namespace}`;

    await this.cache.del(transportNamespace);

    return true;
  }

  // namespace는 transport_id, keyName은 user_id:type 로 하자
  async deleteKey({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<boolean> {
    const transport_id = namespace;
    const transportKey = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${transport_id}`;

    const [user_id, type] = keyName.split(':');
    if (!user_id || !type) return false;
    const userKey = `${CACHE_SFU_NAMESPACE_NAME.USER_INFO}:${user_id.trim()}`;

    const field =
      type.trim() === 'send'
        ? CACHE_SFU_USER_KEY_NAME.SEND_TRANSPORT_ID
        : type.trim() === 'recv'
          ? CACHE_SFU_USER_KEY_NAME.RECV_TRANSPORT_ID
          : null;
    if (!field) return false;

    await this.cache.del(transportKey);
    const current = await this.cache.hGet(userKey, field);
    // 현재 transport_id와 동일하면 삭제
    if (current === transport_id) {
      await this.cache.hDel(userKey, field);
    }

    return true;
  }
}

// user에 개인 producer 정보를 저장
@Injectable()
export class InsertUserProducerDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: InsertProducerDto): Promise<boolean> {
    const userProducerNamespace: string =
      `${CACHE_SFU_NAMESPACE_NAME.PRODUCER_INFO}:${entity.room_id}:${entity.user_id}`.trim();

    if (entity.type !== 'cam' && entity.type !== 'mic') return false;

    try {
      const data = {
        [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID]: entity.producer_id,
        [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE]: entity.type,
        [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.KIND]: entity.kind,
        [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS]: 'on',
      };
      // 중복 방지용 함수
      const ok = await this.cache.hSetNX(userProducerNamespace, entity.kind, JSON.stringify(data));

      return ok === 1;
    } catch (err) {
      return false;
    }
  }
}

@Injectable()
export class InsertMainProducerDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // main에 producer 정보를 저장한다.
  async insert(entity: InsertProducerDto): Promise<boolean> {
    const mainNamespace: string =
      `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`.trim();

    if (entity.type === 'cam' || entity.type === 'mic') return false;

    try {
      const data = {
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID]: entity.producer_id,
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE]: entity.type,
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND]: entity.kind,
        [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID]: entity.user_id,
      };
      // 중복 방지용 함수
      const keyName: string =
        entity.type === 'screen_audio'
          ? CACHE_ROOM_INFO_KEY_NAME.SUB_PRODUCER
          : CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER;

      const ok = await this.cache.hSetNX(mainNamespace, keyName, JSON.stringify(data));

      return ok === 1;
    } catch (err) {
      return false;
    }
  }
}

@Injectable()
export class DeleteUserProducerDataToRedis extends DeleteDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace에 keyname 삭제 namespace는 room_id:user_id
  async deleteKey({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: 'audio' | 'video';
  }): Promise<boolean> {
    const userProducerNamespace: string =
      `${CACHE_SFU_NAMESPACE_NAME.PRODUCER_INFO}:${namespace}`.trim();

    await this.cache.hDel(userProducerNamespace, keyName);

    return true;
  }
}

@Injectable()
export class DeleteMainProducerDataToRedis extends DeleteDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async deleteKey({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: 'screen_video' | 'screen_audio';
  }): Promise<boolean> {
    const mainNamespace: string =
      `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${namespace}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`.trim();

    const keySub: string =
      keyName === 'screen_audio'
        ? CACHE_ROOM_INFO_KEY_NAME.SUB_PRODUCER
        : CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER;

    await this.cache.hDel(mainNamespace, keySub);

    return true;
  }
}

// consumer와 관련된 정보 저장인데 consumer 저장 insert
@Injectable()
export class InsertConsumerDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: InsertConsumerDataDto): Promise<boolean> {
    const insertData = {
      [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.CONSUMER_ID]: entity.consumer_id,
      [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.PRODUCER_ID]: entity.producer_id,
      [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.USER_ID]: entity.user_id,
      [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.STATUS]: entity.status,
      [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.TRANSPORT_ID]: entity.transport_id,
    };
    const insertConsumerNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.CONSUMER_INFO}:${entity.room_id}:${entity.user_id}`;
    const inserted: number = await this.cache.hSet(
      insertConsumerNamespace,
      entity.consumer_id,
      JSON.stringify(insertData),
    );

    return inserted ? true : false;
  }
}

// consumer와 관련된 데이터 삭제
@Injectable()
export class DeleteConsumerDataToRedis extends DeleteDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async deleteKey({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<boolean> | never {
    const deleteNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.CONSUMER_INFO}:${namespace}`;

    await this.cache.hDel(deleteNamespace, keyName);

    return true;
  }
}

// consumer와 관련된 데이터들 redis에 추가함 ( 데이터 여러개 추가 )
@Injectable()
export class InsertConsumerDatasToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: InsertConsumerDatasDto): Promise<boolean> {
    const insertConsumerNamespace = `${CACHE_SFU_NAMESPACE_NAME.CONSUMER_INFO}:${entity.room_id}:${entity.user_id}`;

    const fields: Record<string, string> = {};

    for (const info of entity.consumer_info) {
      const insertData = {
        [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.CONSUMER_ID]: info.consumer_id,
        [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.PRODUCER_ID]: info.producer_id,
        [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.USER_ID]: entity.user_id,
        [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.STATUS]: info.status,
        [CACHE_SFU_CONSUMER_KEY_PROPS_NAME.TRANSPORT_ID]: entity.transport_id,
      };

      // field = consumer_id, value = json
      fields[info.consumer_id] = JSON.stringify(insertData);
    }

    if (Object.keys(fields).length === 0) return true; // 없으면 그냥 반환

    await this.cache.hSet(insertConsumerNamespace, fields);

    return true;
  }
}

// user_producer에 상태 변화
@Injectable()
export class UpdateProducerStatusToRedis extends UpdateDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id:user_id로 오게 된다.  updateValue는 변경값이다.
  async updateKey({
    namespace,
    keyName,
    updateValue,
  }: {
    namespace: string;
    keyName: 'audio' | 'video';
    updateValue: 'on' | 'off';
  }): Promise<boolean> {
    if (updateValue !== 'on' && updateValue !== 'off') return false;
    if (keyName !== 'audio' && keyName !== 'video') return false;

    const userProducerNamespace: string = `${CACHE_SFU_NAMESPACE_NAME.PRODUCER_INFO}:${namespace}`;

    const raw = await this.cache.hGet(userProducerNamespace, keyName);
    if (!raw) return false;

    const produceObject = JSON.parse(raw);
    produceObject[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS] = updateValue;

    await this.cache.hSet(userProducerNamespace, keyName, JSON.stringify(produceObject));

    return true;
  }
}
