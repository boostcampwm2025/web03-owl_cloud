import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import {
  CACHE_ROOM_FILES_KEY_PROPS_NAME,
  CACHE_ROOM_INFO_KEY_NAME,
  CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME,
  CACHE_ROOM_MEMBER_SUB_NAMESPACE_NAME,
  CACHE_ROOM_MEMBERS_KEY_PROPS_NAME,
  CACHE_ROOM_NAMESPACE_NAME,
  CACHE_ROOM_SUB_NAMESPACE_NAME,
  CACHE_SFU_NAMESPACE_NAME,
  CACHE_SFU_PRODUCERS_KEY_NAME,
  CACHE_SFU_PRODUCES_KEY_PROPS_NAME,
  REDIS_SERVER,
} from '../../cache.constants';
import { RoomInfoValues } from '@app/room/dtos';
import {
  GetRoomInfoCacheResult,
  GetRoomMainInfo,
  GetRoomMembersResult,
  MembersInfo,
  ProviderInfo,
  ProviderToolInfo,
} from '@app/room/queries/dto';
import { CacheError, NotAllowToolPayload, NotAllowToolTicket } from '@error/infra/infra.error';
import { CheckUploadFileDtoValidateResult, FindUploadFileInfo } from '@/2.application/room/commands/dto';

@Injectable()
export class SelectRoomInfoFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace에 room_id만 있음
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<RoomInfoValues | undefined> {
    const cache = this.cache;
    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${namespace}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const roomInfo = await cache.hGetAll(roomInfoNamespace);

    // 데이터가 하나도 없다면? ( 애초에 비밀번호를 제외하고 한번에 저장되기 때문에 다 있어야 한다 그리고 추가적으로 시간제한도 없기 때문에 이부분에 대해서는 일단 이렇게 처리해도 좋다고 판단이 된다. )
    if (!roomInfo || Object.keys(roomInfo).length === 0) return undefined;

    return {
      code: roomInfo.code,
      title: roomInfo.title,
      owner_id: roomInfo.owner_id,
      max_particiants: Number(roomInfo.max_particiants),
      current_particiants: Number(roomInfo.current_particiants),
      password_hash:
        roomInfo.password_hash && roomInfo.password_hash.length > 0 ? roomInfo.password_hash : null,
    };
  }
}

// 방에 있는 유저의 정보를 가져와야 한다.
type RoomMemberCacheValue = {
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.SOCKET_ID]?: string;
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IP]?: string;
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME]?: string;
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST]?: string; // "true" | "false"
}; // cache에 저장된 각 멤버가 가진 데이터

type RoomProduceInfoCacheValue = {
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID]?: string;
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE]?: 'mic' | 'cam' | 'screen_video' | 'screen_audio';
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND]?: 'audio' | 'video';
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID]?: string;
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TOOL]?: 'whiteboard' | 'codeeditor';
}; // cache에 저장된 방에 producer가 가진 데이터

type SfuProducerInfoCacheValue = {
  [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID]?: string;
  [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE]?: 'mic' | 'cam' | 'screen_video' | 'screen_audio';
  [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.KIND]?: 'audio' | 'video';
  [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS]?: 'on' | 'off';
}; // 각 유저가 producer 데이터

@Injectable()
export class SelectRoomMemberInfosFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id가 될 예정이다.
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<GetRoomMembersResult> {
    const room_id = namespace;

    // 1. room_id에 데이터를 가져온다.
    const { membersInfoJson, mainProducerRaw, subProducerRaw } =
      await this.getRoomMembersAndMainSub(room_id);

    // 2. member들에 정보를 가져온다.
    const members = this.parseMembers(membersInfoJson);
    const nicknameByUserId = this.makeNicknameMap(members);

    // 3. 멤버들에게 producer를 붙힌다.
    await this.attachUserProducers(room_id, members);

    // 4. main에 정보를 파싱해서 가져온다.
    const mainField = this.buildMainField(mainProducerRaw, subProducerRaw, nicknameByUserId);

    // 5. 정보 전달
    return { main: mainField, members };
  }

  // 방에 있는 정보를 가져올때 사용한다.
  private async getRoomMembersAndMainSub(room_id: string): Promise<{
    membersInfoJson: Record<string, string>;
    mainProducerRaw: string | null;
    subProducerRaw: string | null;
  }> {
    const roomMemberNamespace = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;
    const roomInfoNamespace = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const tx = this.cache.multi();
    tx.hGetAll(roomMemberNamespace)
      .hGet(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER)
      .hGet(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.SUB_PRODUCER);

    const res = await tx.exec();
    if (!res) {
      return { membersInfoJson: {}, mainProducerRaw: null, subProducerRaw: null };
    }

    const membersInfoJson = (res[0] as unknown as Record<string, string>) ?? {};
    const mainProducerRaw = (res[1] as unknown as string | null) ?? null;
    const subProducerRaw = (res[2] as unknown as string | null) ?? null;

    return { membersInfoJson, mainProducerRaw, subProducerRaw };
  }

  // member를 파싱해서 배열로 반환한다.
  private parseMembers(membersInfoJson: Record<string, string>): Array<MembersInfo> {
    const user_ids = Object.keys(membersInfoJson);

    return user_ids.map((user_id) => {
      const userRaw = membersInfoJson[user_id];

      const parsed = this.safeJsonParse<RoomMemberCacheValue>(userRaw) ?? {};

      const nickname = parsed[CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME] ?? '';
      const is_guest_str = parsed[CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST] ?? 'false';
      const is_guest = is_guest_str === 'true';

      return {
        user_id,
        nickname,
        profile_path: null,
        is_guest,
        cam: null, // 나중에 채울 예정
        mic: null, //
      };
    });
  }

  // 나중에 main에서 유저의 정보를 가져온다.
  private makeNicknameMap(members: Array<MembersInfo>): Map<string, string> {
    return new Map(members.map((m) => [m.user_id, m.nickname]));
  }

  // 유저에서 producer를 붙히는 작업
  private async attachUserProducers(room_id: string, members: Array<MembersInfo>): Promise<void> {
    if (members.length === 0) return;

    const tx = this.cache.multi();

    for (const m of members) {
      const userProducerNamespace = `${CACHE_SFU_NAMESPACE_NAME.PRODUCER_INFO}:${room_id}:${m.user_id}`;
      tx.hGet(userProducerNamespace, CACHE_SFU_PRODUCERS_KEY_NAME.AUDIO).hGet(
        userProducerNamespace,
        CACHE_SFU_PRODUCERS_KEY_NAME.VIDEO,
      );
    }

    const res = (await tx.exec()) ?? [];

    let idx = 0;
    for (const m of members) {
      const audioRaw = (res[idx++] as unknown as string | null) ?? null;
      const videoRaw = (res[idx++] as unknown as string | null) ?? null;

      const audioInfo = this.safeJsonParse<SfuProducerInfoCacheValue>(audioRaw);
      const videoInfo = this.safeJsonParse<SfuProducerInfoCacheValue>(videoRaw);

      // mic producer를 붙힌다.
      const audioProducerId = audioInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID];
      const audioType = audioInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE];
      const audioStatus = audioInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS] ?? 'on';
      if (audioProducerId && audioType === 'mic') {
        m.mic = {
          provider_id: audioProducerId,
          kind: 'audio',
          type: 'mic',
          is_paused: audioStatus === 'off' ? true : false,
        };
      }

      // cam producer를 붙힌다.
      const videoProducerId = videoInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID];
      const videoType = videoInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE];
      const videoStatus = videoInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.STATUS] ?? 'on';
      if (videoProducerId && videoType === 'cam') {
        m.cam = {
          provider_id: videoProducerId,
          kind: 'video',
          type: 'cam',
          is_paused: videoStatus === 'off' ? true : false,
        };
      }
    }
  }

  // main이 사용하게 될 함수
  private buildMainField(
    mainProducerRaw: string | null,
    subProducerRaw: string | null,
    nicknameByUserId: Map<string, string>,
  ): GetRoomMainInfo | null {
    const mainParsed = this.safeJsonParse<RoomProduceInfoCacheValue>(mainProducerRaw);
    const subParsed = this.safeJsonParse<RoomProduceInfoCacheValue>(subProducerRaw);

    const main = this.toProviderInfo(mainParsed, nicknameByUserId);
    const sub = this.toProviderInfo(subParsed, nicknameByUserId);

    if (main === null && sub === null) return null;
    return { main, sub };
  }

  // provider 정보를 파싱해준다.
  private toProviderInfo(
    p: RoomProduceInfoCacheValue | null,
    nicknameByUserId: Map<string, string>,
  ): ProviderInfo | ProviderToolInfo | null {
    if (!p) return null;

    const user_id = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID];
    const producer_id = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID];
    const kind = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND];
    const type = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE];
    const tool = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TOOL];

    // tool이 있다면 이걸로 한다. ( 확장성을 고려해서 이러한 방식으로 진행한다. )
    if (user_id && tool)
      return {
        user_id,
        tool,
      };

    if (!user_id || !producer_id || !kind || !type) return null;

    const nickname = nicknameByUserId.get(user_id) ?? '';

    return {
      user_id,
      nickname,
      provider_id: producer_id,
      kind,
      type,
    };
  }

  // 안정성을 높여주는 파싱 만약 없다면 null로 반환한다.
  private safeJsonParse<T>(raw: string | null | undefined): T | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

// user가 멤버가 맞는지 확인
@Injectable()
export class CheckUserPayloadFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id, keyname은 user_id
  async select({ namespace, keyName }: { namespace: string; keyName: string }): Promise<boolean> {
    const room_id: string = namespace.trim();
    const roomMemberNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;
    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const user_id: string = keyName;
    try {
      const [memberExists, mainProducer] = await this.cache
        .multi()
        .hExists(roomMemberNamespace, user_id)
        .hGet(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER)
        .exec();

      const memberExistsBool = Boolean(memberExists);
      return memberExistsBool && !mainProducer; // 방에 인원이어야 하고 + 현재 main_producer에 점유하면 안된다.
    } catch (err) {
      throw err;
    }
  }
}

// 현재 방에 해당 user가 한적이 있는지 그리고 ticket이 존재하는지 확인
const LUA_VERIFY_AND_DELETE_TOOL_TICKET = `
-- KEYS[1] = namespaceInfo (hash key)
-- ARGV[1] = field_main_producer
-- ARGV[2] = field_tool_ticket
-- ARGV[3] = expected_user_id
-- ARGV[4] = expected_tool
-- ARGV[5] = presented_ticket

local key = KEYS[1]
local fProducer = ARGV[1]
local fTicket = ARGV[2]
local userId = ARGV[3]
local tool = ARGV[4]
local ticket = ARGV[5]

local producerJson = redis.call("HGET", key, fProducer)
if not producerJson then
  return {0, "NO_PRODUCER"}
end

local storedTicket = redis.call("HGET", key, fTicket)
if not storedTicket then
  return {0, "NO_TICKET"}
end

if storedTicket ~= ticket then
  return {0, "TICKET_MISMATCH"}
end

local ok, producer = pcall(cjson.decode, producerJson)
if not ok or not producer then
  return {0, "PRODUCER_JSON_INVALID"}
end

if producer["user_id"] ~= userId then
  return {0, "USER_MISMATCH"}
end

if producer["tool"] ~= tool then
  return {0, "TOOL_MISMATCH"}
end

redis.call("HDEL", key, fTicket)

return {1, "OK"}
`;
@Injectable()
export class CheckToolTicketFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id, keyname은 user_id:tool:ticket 이렇게 온다.
  async select({ namespace, keyName }: { namespace: string; keyName: string }): Promise<boolean> {
    const room_id: string = namespace;
    const [user_id, tool, ticket] = keyName.split(':');

    if (!user_id || !tool || !ticket) throw new NotAllowToolPayload();

    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const res = (await this.cache.eval(LUA_VERIFY_AND_DELETE_TOOL_TICKET, {
      keys: [roomInfoNamespace],
      arguments: [
        CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER,
        CACHE_ROOM_INFO_KEY_NAME.TOOL_TICKET,
        user_id.trim(),
        tool.trim(),
        ticket.trim(),
      ],
    })) as [number, string];

    const ok = res[0] === 1;
    if (ok) return true;

    const reason = res[1];
    switch (reason) {
      case 'NO_TICKET':
      case 'TICKET_MISMATCH':
        throw new NotAllowToolTicket();

      case 'NO_PRODUCER':
      case 'USER_MISMATCH':
      case 'TOOL_MISMATCH':
        throw new NotAllowToolPayload();

      default:
        throw new NotAllowToolTicket();
    }
  }
}

// user가 멤버가 맞는지 확인
@Injectable()
export class CheckRoomUserFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id, keyname은 user_id:tool
  async select({ namespace, keyName }: { namespace: string; keyName: string }): Promise<boolean> {
    const room_id: string = namespace.trim();
    const roomMemberNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;
    const roomInfoNamespace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const [user_id, tool] = keyName.split(':');
    if (!user_id || !tool) throw new NotAllowToolPayload();

    if (tool !== 'whiteboard' && tool !== 'codeeditor') throw new NotAllowToolPayload();

    try {
      const [memberExists, mainProducer] = await this.cache
        .multi()
        .hExists(roomMemberNamespace, user_id)
        .hGet(roomInfoNamespace, CACHE_ROOM_INFO_KEY_NAME.MAIN_PRODUCER)
        .exec();

      const memberExistsBool = Boolean(memberExists);
      if (!memberExistsBool) return false;
      if (!mainProducer) return false;

      const paresd = JSON.parse(String(mainProducer));
      if (paresd.tool !== tool) return false;
      return true;
    } catch (err) {
      throw err;
    }
  }
}

// room의 정보를 가져온다. ->
@Injectable()
export class SelectRoomInfoDataFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // namespace는 room_id 이다.
  async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<GetRoomInfoCacheResult> {
    const room_id: string = namespace;

    const roomInfoNameSpace: string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const roomInfo = await this.cache.hGetAll(roomInfoNameSpace);

    return {
      current_participants: Number(roomInfo[CACHE_ROOM_INFO_KEY_NAME.CURRENT_PARTICIANTS]),
      max_participants: Number(roomInfo[CACHE_ROOM_INFO_KEY_NAME.MAX_PARTICIANTS]),
    };
  }
}

// 유저가 실제로 방에 위치한 유저가 맞는지 확인하고 upload_id에 상태에 대해서 확인한다. ( 일단 상태까지 모두 )
@Injectable()
export class CheckUserAndSelectPrevFileInfoFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  };

  // namespace는 room_id:user_id 이고 keyname은 filename:mime_type:size 이다.
  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<FindUploadFileInfo | undefined> {
    
    // 1. user가 방에 있는 사람인지 확인 
    const [ room_id, user_id ] = namespace.split(":");
    if ( !room_id || !user_id ) throw new CacheError("room_id, user_id가 없습니다 다시 확인해주세요");

    const roomMemberNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;
    const user = await this.cache.hExists(roomMemberNamespace, user_id);
    if ( !user ) throw new CacheError("현재 방에 위치한 유저가 아닙니다."); // 유저가 아님
    
    const fileIdNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${namespace}:${CACHE_ROOM_MEMBER_SUB_NAMESPACE_NAME.FILE_IDS}`;
    const file_id : string | null = await this.cache.hGet(fileIdNamespace, keyName);
    if ( !file_id ) return undefined;

    // 존재하면 현재 상태 확인
    const roomFileInfoNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.FILES}`;
    const fileInfo = await this.cache.hGet(roomFileInfoNamespace, file_id);
    if ( !fileInfo ) return undefined;
    try {
      const obj = JSON.parse(fileInfo);
      const status : string = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS];
      if ( status !== "uploading" &&  status !== "completed" ) throw new CacheError("status가 잘못저장되어 있습니다.");

      return {
        file_id, status, upload_id: obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.UPLOAD_ID] ?? null
      }
    } catch (err) {
      // 불량은 삭제한다. 
      await this.cache.hDel(roomFileInfoNamespace, file_id);
      return undefined;
    };
  };

};

// 찾으려는 파일이 맞는지 확인하기 위한 infra 코드
@Injectable()
export class CheckUserAndSelectFileInfoFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  };  

  // namespace는 room_id:user_id 이고 keyname은 file_id 이다. 
  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<CheckUploadFileDtoValidateResult | undefined> {

    const [ room_id, user_id ] = namespace.split(":");
    if ( !room_id || !user_id ) throw new CacheError("room_id, user_id가 없습니다 다시 확인해주세요");
    const file_id : string = keyName;    

    // 1. 현재 방의 멤버인지 확인
    const roomMemberNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;
    const roomFileInfoNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.FILES}`;
    
    const result = await this.cache
    .multi()
    .hExists(roomMemberNamespace, user_id)
    .hGet(roomFileInfoNamespace, file_id)
    .exec();
    
    if (!result) return undefined; // 데이터가 없는 경우

    // 2. 데이터 가져오기 
    const isMember = Boolean(result[0] as unknown as number | boolean);
    const rawFileInfo = result[1] as unknown as string | null;

    if (!isMember) return undefined;
    if (!rawFileInfo) return undefined;

    try {
      const obj = JSON.parse(rawFileInfo) as Record<string, any>;

      const filename = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.FILENAME];
      const mime_type = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.MIME_TYPE];
      const category = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.CATEGORY];
      const size = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.SIZE];
      const upload_id = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.UPLOAD_ID] ?? null;
      const nickname = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.NICKNAME];
      const status = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS];

      // 불량데이터 방지

      // category는 맞는지
      const isValidCategory =
        category === "image" ||
        category === "video" ||
        category === "audio" ||
        category === "text" ||
        category === "binary";

      // status는 제대로 저장이 되는지 확인
      const isValidStatus = status === "uploading" || status === "completed";

      if (

        // 타입이랑 각 데이터는 제대로 저장이 되었는지 확인 
        typeof filename !== "string" ||
        typeof mime_type !== "string" ||
        typeof nickname !== "string" ||
        typeof size !== "number" ||
        !isValidCategory ||
        !isValidStatus ||
        !(upload_id === null || typeof upload_id === "string")
      ) {
        // 불량 데이터면 정리
        await this.cache.hDel(roomFileInfoNamespace, file_id);
        return undefined;
      }

      const result: CheckUploadFileDtoValidateResult = {
        status,
        filename,
        size,
        category,
        upload_id,
        nickname,
        mime_type,
      };

      return result;
    } catch {
      // JSON이 깨졌으면 정리
      await this.cache.hDel(roomFileInfoNamespace, file_id);
      return undefined;
    }

  };

};

// 방에 있는 유저가 맞는지 그리고 file_id에 상태가 completed가 맞는지 확인
@Injectable()
export class CheckRoomMemberFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  };  

  // namespace는 room_id:user_id이고 keyName은 file_id 이다. 
  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<string | undefined> {
    
    const [ room_id, user_id ] = namespace.split(":");
    if ( !room_id || !user_id ) throw new CacheError("room_id, user_id가 없습니다 다시 확인해주세요");
    const file_id : string = keyName;  

    // 현재방의 멤버가 맞는지 확인
    const roomMemberNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;
    const roomFileInfoNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.FILES}`;

    const result = await this.cache
    .multi()
    .hExists(roomMemberNamespace, user_id)
    .hGet(roomFileInfoNamespace, file_id)
    .exec();
    
    if (!result) return undefined; // 데이터가 없는 경우

    // 2. 데이터 가져오기 
    const isMember = Boolean(result[0] as unknown as number | boolean);
    const rawFileInfo = result[1] as unknown as string | null;
    if (!isMember) return undefined;
    if (!rawFileInfo) return undefined;

    // parsing 안되면 다운로드 불가 
    let obj: Record<string, any>;
    try {
      obj = JSON.parse(rawFileInfo);
    } catch {
      return undefined;
    }

    const status = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.STATUS];
    if (status !== "completed") return undefined;

    const fileName = obj[CACHE_ROOM_FILES_KEY_PROPS_NAME.FILENAME];
    if (typeof fileName !== "string" || fileName.length === 0) return undefined;

    return fileName; // mime_type 반환
  };

};