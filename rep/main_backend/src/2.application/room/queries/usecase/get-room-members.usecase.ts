import { Injectable } from "@nestjs/common";
import { GetRoomMembersDto, GetRoomMembersResult } from "../dto";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";


type GetRoomMembersUsecaseProps<T> = {
  selectRoomMemberInfosFromCache : SelectDataFromCache<T>
};

@Injectable()
export class GetRoomMembersUsecase<T> {

  private readonly selectRoomMemberInfosFromCache : GetRoomMembersUsecaseProps<T>["selectRoomMemberInfosFromCache"];

  constructor({
    selectRoomMemberInfosFromCache 
  } : GetRoomMembersUsecaseProps<T>) {
    this.selectRoomMemberInfosFromCache  = selectRoomMemberInfosFromCache;
  }

  async execute(dto : GetRoomMembersDto) : Promise<GetRoomMembersResult> {

    // 1. room에 해당 하는 전체 멤버를 cache에서 가져온다. ( + producer_id 정보도 같이 ) -> 해당 room에 room_id만 가져온다.
    const result : GetRoomMembersResult = await this.selectRoomMemberInfosFromCache.select({ namespace : dto.room_id, keyName : "" }); 
    
    // 2. 이 멤버에 해당하는 유저의 프로필 사진 정보를 보내준다. ( 현재 부족한건  )

    // 3. 그 사진의 s3내에 저장된 루트를 확인한다. ( 나중에 추가 로직 )

    return result;
  };

};