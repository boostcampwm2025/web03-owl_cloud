import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_ROOM_INFO_KEY_NAME, CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME, CACHE_ROOM_MEMBERS_KEY_PROPS_NAME, CACHE_ROOM_NAMESPACE_NAME, CACHE_ROOM_SUB_NAMESPACE_NAME, CACHE_SFU_NAMESPACE_NAME, CACHE_SFU_PRODUCERS_KEY_NAME, CACHE_SFU_PRODUCES_KEY_PROPS_NAME, REDIS_SERVER } from "../../cache.constants";
import { RoomInfoValues } from "@app/room/dtos";
import { GetRoomMainInfo, GetRoomMembersResult, MembersInfo, ProviderInfo } from "@app/room/queries/dto";


@Injectable()
export class SelectRoomInfoFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>
  ) { super(cache); };

  // namespace에 room_id만 있음
  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<RoomInfoValues | undefined> {
    
    const cache = this.cache;
    const roomInfoNamespace : string = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${namespace}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const roomInfo = await cache.hGetAll(roomInfoNamespace);

    // 데이터가 하나도 없다면? ( 애초에 비밀번호를 제외하고 한번에 저장되기 때문에 다 있어야 한다 그리고 추가적으로 시간제한도 없기 때문에 이부분에 대해서는 일단 이렇게 처리해도 좋다고 판단이 된다. )
    if ( !roomInfo || Object.keys(roomInfo).length === 0 ) return undefined;

    return {
      code : roomInfo.code,
      title : roomInfo.title,
      owner_id : roomInfo.owner_id,
      max_particiants : Number(roomInfo.max_particiants),
      current_particiants : Number(roomInfo.current_particiants),
      password_hash : 
        roomInfo.password_hash && roomInfo.password_hash.length > 0
        ? roomInfo.password_hash : null
    };
  }
};

// 방에 있는 유저의 정보를 가져와야 한다. 
type RoomMemberCacheValue = {
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.SOCKET_ID]?: string;
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IP]?: string;
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME]?: string;
  [CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST]?: string; // "true" | "false"
}; // cache에 저장된 각 멤버가 가진 데이터

type RoomProduceInfoCacheValue = {
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID]?: string;
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE]?: "mic" | "cam" | "screen_video" | "screen_audio";
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND]?: "audio" | "video";
  [CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID]?: string;
}; // cache에 저장된 방에 producer가 가진 데이터

type SfuProducerInfoCacheValue = {
  [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID]?: string;
  [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE]?: "mic" | "cam" | "screen_video" | "screen_audio";
  [CACHE_SFU_PRODUCES_KEY_PROPS_NAME.KIND]?: "audio" | "video";
}; // 각 유저가 producer 데이터

@Injectable()
export class SelectRoomMemberInfosFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>
  ) { super(cache); };

  // namespace는 room_id가 될 예정이다.
  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<GetRoomMembersResult> {
    
    const room_id = namespace;

    // 1. room_id에 데이터를 가져온다. 
    const { membersInfoJson, mainProducerRaw, subProducerRaw } = await this.getRoomMembersAndMainSub(room_id);

    // 2. member들에 정보를 가져온다.
    const members = this.parseMembers(membersInfoJson);
    const nicknameByUserId = this.makeNicknameMap(members);

    // 3. 멤버들에게 producer를 붙힌다.
    await this.attachUserProducers(room_id, members);

    // 4. main에 정보를 파싱해서 가져온다.
    const mainField = this.buildMainField(mainProducerRaw, subProducerRaw, nicknameByUserId);

    // 5. 정보 전달
    return { main: mainField, members };
  };

  // 방에 있는 정보를 가져올때 사용한다.
  private async getRoomMembersAndMainSub(room_id: string): Promise<{
    membersInfoJson: Record<string, string>;
    mainProducerRaw: string | null;
    subProducerRaw: string | null;
  }> {
    const roomMemberNamespace = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.MEMBERS}`;
    const roomInfoNamespace = `${CACHE_ROOM_NAMESPACE_NAME.CACHE_ROOM}:${room_id}:${CACHE_ROOM_SUB_NAMESPACE_NAME.INFO}`;

    const tx = this.cache.multi();
    tx
      .hGetAll(roomMemberNamespace)
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
  };

  // member를 파싱해서 배열로 반환한다.
  private parseMembers(membersInfoJson: Record<string, string>): Array<MembersInfo> {
    const user_ids = Object.keys(membersInfoJson);

    return user_ids.map((user_id) => {
      const userRaw = membersInfoJson[user_id];

      const parsed = this.safeJsonParse<RoomMemberCacheValue>(userRaw) ?? {};

      const nickname = parsed[CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.NICKNAME] ?? "";
      const is_guest_str = parsed[CACHE_ROOM_MEMBERS_KEY_PROPS_NAME.IS_GUEST] ?? "false";
      const is_guest = is_guest_str === "true";

      return {
        user_id,
        nickname,
        profile_path: null,
        is_guest,
        cam: null, // 나중에 채울 예정
        mic: null, // 
      };
    });
  };

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
      tx
        .hGet(userProducerNamespace, CACHE_SFU_PRODUCERS_KEY_NAME.AUDIO)
        .hGet(userProducerNamespace, CACHE_SFU_PRODUCERS_KEY_NAME.VIDEO);
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
      if (audioProducerId && audioType === "mic") {
        m.mic = { provider_id: audioProducerId, kind: "audio", type: "mic" };
      }

      // cam producer를 붙힌다.
      const videoProducerId = videoInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.PRODUCER_ID];
      const videoType = videoInfo?.[CACHE_SFU_PRODUCES_KEY_PROPS_NAME.TYPE];
      if (videoProducerId && videoType === "cam") {
        m.cam = { provider_id: videoProducerId, kind: "video", type: "cam" };
      }
    }
  };

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
  ): ProviderInfo | null {
    if (!p) return null;

    const user_id = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.USER_ID];
    const producer_id = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.PRODUCER_ID];
    const kind = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.KIND];
    const type = p[CACHE_ROOM_INFO_PRODUCE_KEY_PROPS_NAME.TYPE];

    if (!user_id || !producer_id || !kind || !type) return null;

    const nickname = nicknameByUserId.get(user_id) ?? "";

    return {
      user_id,
      nickname,
      provider_id: producer_id,
      kind,
      type,
    };
  };

  // 안정성을 높여주는 파싱 만약 없다면 null로 반환한다.
  private safeJsonParse<T>(raw: string | null | undefined): T | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

};