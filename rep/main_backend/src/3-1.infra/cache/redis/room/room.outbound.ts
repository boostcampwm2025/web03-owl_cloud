import {
  DeleteDatasToCache,
  DeleteDataToCache,
  InsertDataToCache,
  UpdateDataToCache,
} from '@app/ports/cache/cache.outbound';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import {
  CACHE_ROOM_FILES_KEY_PROPS_NAME,
  CACHE_ROOM_INFO_KEY_NAME,
  CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME,
  CACHE_ROOM_MEMBER_SUB_NAMESPACE_NAME,
  CACHE_ROOM_MEMBERS_KEY_PROPS_NAME,
  CACHE_ROOM_NAMESPACE_NAME,
  CACHE_ROOM_SOCKETS_KEY_PROPS_NAME,
  CACHE_ROOM_SUB_NAMESPACE_NAME,
  REDIS_SERVER,
} from '../../cache.constants';
import { RoomProps } from '@domain/room/vo';
import {
  CheckUploadFileDto,
  InsertRoomDataDto,
  InsertToolInfoData,
  InsertUploadFileInfoDto,
} from '@app/room/commands/dto';
import { CacheError } from '@error/infra/infra.error';

@Injectable()
export class InsertRoomDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: Required<RoomProps>): Promise<boolean> {
    // room 관련 namespace 생성
    const roomNamespace: string =
      `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`.trim();

    // watch는 필요없을것 같다 왜냐 room_id가 랜덤이니까
    const roomInfoKeyValue: Record<string, string> = {
      [CACHE_ROOM_INFO_KEY_NAME.CODE]: entity.code,
      [CACHE_ROOM_INFO_KEY_NAME.TITLE]: entity.title,
      [CACHE_ROOM_INFO_KEY_NAME.OWNER_ID]: entity.owner_user_id,
      [CACHE_ROOM_INFO_KEY_NAME.MAX_PARTICIANTS]: String(entity.max_participants),
      [CACHE_ROOM_INFO_KEY_NAME.CURRENT_PARTICIANTS]: '0',
    };

    if (entity.password_hash)
      roomInfoKeyValue[CACHE_ROOM_INFO_KEY_NAME.PASSWORD_HASH] = entity.password_hash;

    await this.cache.hSet(roomNamespace, roomInfoKeyValue);

    return true;
  }
}

// 회의방 참여와 관련된 redis 정의
@Injectable()
export class InsertRoomDatasToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: InsertRoomDataDto): Promise<boolean> {
    const cache = this.cache;

    // 정합성을 추가하고 싶다 이유는 만약 동시에 유저가 접근하면 인원수 올릴때 문제가 발생할 수 있기 때문이다.
    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;
    const roomMemberNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;

    // 이건 굳이 필요없긴 하다.
    const roomSocketNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${CACHE_ROOM_SUB_NAMESPACE_NAME.SOCKETS}`;

    // 경합 때문에 재시도를 추가하면 좋긴 하다. ( 나중에는 lua를 적용해서 정합성 + 성능을 높이자. )
    for (let att: number = 0; att < 5; att++) {
      await cache.watch([roomInfoNamespace, roomMemberNamespace]);

      try {
        const alreadyMember = await cache.hExists(roomMemberNamespace, entity.user_id); // 이미 유저가 존재할 경우 ( 인원을 늘리면 안된다. )

        const tx = cache.multi();

        // 인원이 존재한다면 스킵
        if (alreadyMember) {
          tx.hSet(
            roomMemberNamespace,
            entity.user_id,
            JSON.stringify({
              [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IP]: entity.ip,
              [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME]: entity.nickname,
              [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.SOCKET_ID]: entity.socket_id,
              [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST]: entity.is_guest ? 'true' : 'false',
            }),
          ) // member에 추가
            .hSet(
              roomSocketNamespace,
              entity.socket_id,
              JSON.stringify({
                [CACHE_ROOM_SOCKETS_KEY_PROPS_NAME.IP]: entity.ip,
                [CACHE_ROOM_SOCKETS_KEY_PROPS_NAME.ROOM_ID]: entity.room_id,
                [CACHE_ROOM_SOCKETS_KEY_PROPS_NAME.USER_ID]: entity.user_id,
              }),
            );

          const result = await tx.exec();
          if (result !== null) return true;
          continue;
        }

        const [currentStr, maxStr] = await cache.hmGet(roomInfoNamespace, [
          CACHE_ROOM_INFO_KEY_NAME.CURRENT_PARTICIANTS,
          CACHE_ROOM_INFO_KEY_NAME.MAX_PARTICIANTS,
        ] as any);

        // 일단 숫자로서 맞는지 확인
        const current = Number(currentStr ?? '0');
        const max = Number(maxStr ?? '0');
        if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
          return false;
        }

        // 추가가 안되는 부분이다.
        if (current >= max) {
          return false;
        }

        tx.hSet(
          roomMemberNamespace,
          entity.user_id,
          JSON.stringify({
            [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IP]: entity.ip,
            [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME]: entity.nickname,
            [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.SOCKET_ID]: entity.socket_id,
            [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST]: entity.is_guest ? 'true' : 'false',
          }),
        )
          .hIncrBy(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.CURRENT_PARTICIANTS, 1)
          .hSet(
            roomSocketNamespace,
            entity.socket_id,
            JSON.stringify({
              [CACHE_ROOM_SOCKETS_KEY_PROPS_NAME.IP]: entity.ip,
              [CACHE_ROOM_SOCKETS_KEY_PROPS_NAME.ROOM_ID]: entity.room_id,
              [CACHE_ROOM_SOCKETS_KEY_PROPS_NAME.USER_ID]: entity.user_id,
            }),
          );

        const result = await tx.exec();
        if (result !== null) return true;
      } finally {
        await cache.unwatch();
      }
    }

    return false;
  }
}

// redis에 대한 회의방 정보 수정및 삭제
@Injectable()
export class DeleteRoomDatasToRedis extends DeleteDatasToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // room_id, socket_id, user_id 이렇게 순서대로 값이 넣어져 있다.
  async deleteNamespaces(namespaces: Array<string>): Promise<boolean> {
    const [room_id, socket_id, user_id] = namespaces;
    if (!room_id || !socket_id || !user_id)
      throw new CacheError('namespace에 값이 모두들어오지 않았습니다.');

    // namespace -> 이거는 있어야 하지 않나...
    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;
    const roomMemberNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;

    // 이건 적용할 필요가 없어보이는데..
    const roomSocketNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${CACHE_ROOM_SUB_NAMESPACE_NAME.SOCKETS}`;

    const cache = this.cache;
    for (let att: number = 0; att < 5; att++) {
      await cache.watch([roomInfoNamespace, roomMemberNamespace]);

      try {
        // 멤버가 존재하지 않는다면
        const checkMember = await cache.hGet(roomMemberNamespace, user_id);
        if (!checkMember) {
          const deleted = await cache.hDel(roomSocketNamespace, socket_id);
          return deleted ? true : false;
        }

        const tx = cache.multi();
        tx.hDel(roomSocketNamespace, socket_id)
          .hDel(roomMemberNamespace, user_id)
          .hIncrBy(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.CURRENT_PARTICIANTS, -1);

        const result = await tx.exec();
        if (result !== null) return true;
      } finally {
        await cache.unwatch();
      }
    }

    return false;
  }
}

// lua 사용 -> 원자성이 보장되어야 함으로
const LUA_SET_PRODUCER_AND_TICKET_IF_EMPTY = `
local key = KEYS[1]
local producerField = ARGV[1]
local ticketField = ARGV[2]
local producerValue = ARGV[3]
local ticketValue = ARGV[4]

if redis.call('HEXISTS', key, producerField) == 1 then
  return {0, 'PRODUCER_EXISTS'}
end
if redis.call('HEXISTS', key, ticketField) == 1 then
  return {0, 'TICKET_EXISTS'}
end

redis.call('HSET', key, producerField, producerValue)
redis.call('HSET', key, ticketField, ticketValue)
return {1, 'OK'}
`;
@Injectable()
export class InsertToolTicketToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: InsertToolInfoData): Promise<boolean> {
    const room_id = entity.room_id.trim();
    const namespaceInfo = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const producerInfo = JSON.stringify({
      [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID]: entity.user_id,
      [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TOOL]: entity.tool,
    });

    // redis를 eval로 사용함
    const res = (await this.cache.eval(LUA_SET_PRODUCER_AND_TICKET_IF_EMPTY, {
      keys: [namespaceInfo],
      arguments: [
        CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER,
        CACHE_ROOM_INFO_KEY_NAME.TOOL_TICKET,
        producerInfo,
        entity.ticket,
      ],
    })) as [number, string];

    const ok = res[0] === 1;
    if (ok) return true;

    const reason = res[1];
    if (reason === 'PRODUCER_EXISTS') {
      throw new ConflictException('이미 main_producer가 존재합니다.');
    }
    if (reason === 'TICKET_EXISTS') {
      throw new ConflictException('이미 tool_ticket이 존재합니다.');
    }
    throw new ConflictException('tool_ticket을 볼 수 없습니다.');
  }
}

@Injectable()
export class DeleteMainProducerFromRedis extends DeleteDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id 이다.
  async deleteNamespace(namespace: string): Promise<boolean> {
    const room_id: string = namespace;
    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const deleted: number = await this.cache.hDel(
      roomInfoNamespace,
      CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER,
    );

    return deleted ? true : false;
  }
}

// 파일 정보를 저장하는 로직
@Injectable()
export class InsertFileInfoToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: InsertUploadFileInfoDto): Promise<boolean> {
    // 저장해야 하는 것은 두곳이다 하나라도 저장이 안되면 에러가 발생한다.
    const fileIdNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${entity.user_id}:${CACHE_ROOM_MEMBER_SUB_NAMESPACE_NAME.FILE_IDS}`;
    const keyName: string = `${entity.filename}:${entity.mime_type}:${entity.size}`;

    const roomFileInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.FILES}`;
    const fileInfoData = JSON.stringify({
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.FILENAME]: entity.filename,
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.MIME_TYPE]: entity.mime_type,
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.CATEGORY]: entity.category,
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.SIZE]: entity.size,
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.UPLOAD_ID]: entity.upload_id ?? null,
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.USER_ID]: entity.user_id,
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.NICKNAME]: entity.nickname,
      [CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS]: 'uploading',
    });

    await this.cache
      .multi()
      .hSet(fileIdNamespace, keyName, entity.file_id) // 이 부분은 좀 만료가 있으면 다루기 편할것 같다.
      .expire(fileIdNamespace, 60 * 60) // 이게 맞는것 같다 ( 유저가 나갔다고 바로 없애기 보다는 유저가 다시 들어왔을때 편하게 올리는 용도이니까 남기고 1시간동안 건드리는게 없으면 그때 지워도 좋을것 같다. )
      .hSet(roomFileInfoNamespace, entity.file_id, fileInfoData) // 이건좀 만료하면 않좋을것 같고
      .exec();

    return true;
  }
}

// 해당 파일의 상태를 업데이트 한다.
@Injectable()
export class UpdateFileInfoToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  async insert(entity: CheckUploadFileDto): Promise<boolean> {
    const roomFileInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${entity.room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.FILES}`;

    const result = await this.cache.hGet(roomFileInfoNamespace, entity.file_id);

    if (!result) return false;

    try {
      const obj = JSON.parse(result) as Record<string, any>;

      // status를 변경
      obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS] = 'completed';

      await this.cache.hSet(roomFileInfoNamespace, entity.file_id, JSON.stringify(obj));

      return true;
    } catch {
      // JSON이 깨져 있으면 불량 데이터는 삭제한다.
      await this.cache.hDel(roomFileInfoNamespace, entity.file_id);
      return false;
    }
  }
}

// redis에서 비밀번호를 변경하거나 null로 바꿀수 있습니다.
@Injectable()
export class UpdateRoomPasswordToRedis extends UpdateDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id updateValue는 password_hash 이다
  async updateKey({
    namespace,
    keyName,
    updateValue,
  }: {
    namespace: string;
    keyName: string;
    updateValue: string | null;
  }): Promise<boolean> {
    const room_id: string = namespace;
    const namespaceInfo = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const password_hash: string | null = updateValue;

    // 비밀번호가 있다면 비밀번호 변경해 주어야 합니다.
    if (password_hash !== null) {
      await this.cache.hSet(namespaceInfo, CACHE_ROOM_INFO_KEY_NAME.PASSWORD_HASH, password_hash);
    }
    // null인 경우 공개방으로 체인지
    else {
      await this.cache.hDel(namespaceInfo, CACHE_ROOM_INFO_KEY_NAME.PASSWORD_HASH);
    }

    return true;
  }
}
