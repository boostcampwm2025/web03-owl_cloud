// sfu 서버에서 produce를 생성할때 사용하는 usecase라고 할 수 있다. 
import { Injectable } from "@nestjs/common";
import { CreatePropduceDto } from "../dto";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { DeleteDataToCache, InsertDataToCache } from "@app/ports/cache/cache.outbound";
import type { ProducerRepositoryPort } from "../../ports/produce-repo.port";


type CreateProduceUsecaseProps<T> = {
  selectTransportDataFromCache : SelectDataFromCache<T>; // transport_id를 이용해서 해당 데이터를 찾기
  selectUserProducerDataFromCache : SelectDataFromCache<T>; // 개인에 produce 데이터가 cache에 존재하는지 확인
  selectMainProducerDataFromCache : SelectDataFromCache<T>; // main에 produce 데이터가 cache에 존재하는지 확인
  insertUserProducerDataToCache : InsertDataToCache<T>; // 개인 produce 데이터를 cache에 저장
  insertMainProducerDataToCache : InsertDataToCache<T>; // main produce 데이터를 cache에 저장
  deleteUserProducerDataToCache : DeleteDataToCache<T>; // 개인 produce 데이터를 cache에 삭제 
  deleteMainProducerDataToCache : DeleteDataToCache<T>; // main produce 데이터를 cache에 삭제 
}

@Injectable()
export class CreateProduceUsecase<T> {

  private readonly selectTransportDataFromCache : CreateProduceUsecaseProps<T>["selectTransportDataFromCache"];
  private readonly selectUserProducerDataFromCache : CreateProduceUsecaseProps<T>["selectUserProducerDataFromCache"];
  private readonly selectMainProducerDataFromCache : CreateProduceUsecaseProps<T>["selectMainProducerDataFromCache"];
  private readonly insertUserProducerDataToCache : CreateProduceUsecaseProps<T>["insertUserProducerDataToCache"];
  private readonly insertMainProducerDataToCache : CreateProduceUsecaseProps<T>["insertMainProducerDataToCache"];
  private readonly deleteUserProducerDataToCache : CreateProduceUsecaseProps<T>["deleteUserProducerDataToCache"];
  private readonly deleteMainProducerDataToCache : CreateProduceUsecaseProps<T>["deleteMainProducerDataToCache"];

  constructor(
  private readonly produceRepo : ProducerRepositoryPort,
  {
    selectTransportDataFromCache, selectUserProducerDataFromCache, selectMainProducerDataFromCache, insertUserProducerDataToCache, insertMainProducerDataToCache, deleteUserProducerDataToCache, deleteMainProducerDataToCache
  } : CreateProduceUsecaseProps<T>) {
    this.selectTransportDataFromCache = selectTransportDataFromCache;
    this.selectUserProducerDataFromCache = selectUserProducerDataFromCache;
    this.selectMainProducerDataFromCache = selectMainProducerDataFromCache;
    this.insertUserProducerDataToCache = insertUserProducerDataToCache;
    this.insertMainProducerDataToCache = insertMainProducerDataToCache;
    this.deleteUserProducerDataToCache = deleteUserProducerDataToCache;
    this.deleteMainProducerDataToCache = deleteMainProducerDataToCache;
  }

  async execute(dto : CreatePropduceDto) {

    // 1. transport_id를 검증 
    // -> ( user_id, socket_id, room_id, type은 send가 맞는지 확인 )
    // -> type이 cam, mic이 맞는지 ( 아니라면 main을 확인 )
    // -> 현재 값이 존재하는지 확인 ( 여러번 등록하게 하면 안된다. )
    // -> 개인에 대한 데이터가 존재하는지 확인 or main에 현재 데이터가 존재하는지 확인

    // 2. produce 연결

    // 3. produce를 메모리에 저장

    // 4. cache에 관련 정보를 저장
    // -> cam, mic 정보에 대해서 저장, main이라면 main에다 저장 ( 개인 또는 main에 저장 )

    // 5. produce_id 정보 전달, kind, user_id 정보 전달 ( 모든 audio, video 전달 해야함 )

    // 2-1. produce가 닫히면 관련 정보가 다 삭제 되어야 한다. ( 메모리 + cache )
    // -> cam, mic 이면 개인에 정보 삭제, main이면 main에 정보 삭제 
    // -> 메모리에 produce 정보 삭제 

  };

};