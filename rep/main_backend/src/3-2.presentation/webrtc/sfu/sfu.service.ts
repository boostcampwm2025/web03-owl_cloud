import { MediasoupService } from "@infra/media/mediasoup/media";
import { Injectable } from "@nestjs/common";


@Injectable()
export class SfuService {

  // sfu 서버가 관리하는 로직 ( 메모리 낭비가 있는데 어떻게 하면 좀 효율적으로 저장이 가능할까? )
  

  constructor(
    private readonly mediaSoupService : MediasoupService,
  ) {}

  // 1. router 생성 관련 함수
  

};