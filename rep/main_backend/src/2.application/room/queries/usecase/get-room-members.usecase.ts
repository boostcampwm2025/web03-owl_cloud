import { Injectable } from "@nestjs/common";
import { GetRoomMembersDto, GetRoomMembersResult } from "../dto";


type GetRoomMembersUsecaseProps = {

};

@Injectable()
export class GetRoomMembersUsecase {

  constructor({

  } : GetRoomMembersUsecaseProps) {}

  async execute(dto : GetRoomMembersDto)  {

    // 1. room에 해당 하는 전체 멤버를 cache에서 가져온다. ( + producer_id 정보도 같이 ) 


    // 2. 이 멤버에 해당하는 유저의 정보를 보내준다. 

  };

};