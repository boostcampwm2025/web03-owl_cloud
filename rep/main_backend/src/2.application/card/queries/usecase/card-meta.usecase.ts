import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { Injectable } from "@nestjs/common";


type CardMetaUsecaseProps<T, CT> = {
  selectCardMetaAndStatFromDb : SelectDataFromDb<T>;
  selectCardMetaAndStatFromCache : SelectDataFromCache<CT>;
  insertCardMetaAndStatToCache : InsertDataToCache<CT>;
};

@Injectable()
export class CardMetaDataUsecase<T, CT> {

  private readonly selectCardMetaAndStatFromDb : CardMetaUsecaseProps<T, CT>["selectCardMetaAndStatFromDb"];
  private readonly selectCardMetaAndStatFromCache : CardMetaUsecaseProps<T, CT>["selectCardMetaAndStatFromCache"];
  private readonly insertCardMetaAndStatToCache : CardMetaUsecaseProps<T, CT>["insertCardMetaAndStatToCache"];

  constructor({
    selectCardMetaAndStatFromDb,  selectCardMetaAndStatFromCache, insertCardMetaAndStatToCache
  } : CardMetaUsecaseProps<T, CT>) {
    this.selectCardMetaAndStatFromDb = selectCardMetaAndStatFromDb;
    this.selectCardMetaAndStatFromCache = selectCardMetaAndStatFromCache;
    this.insertCardMetaAndStatToCache = insertCardMetaAndStatToCache;
  }

  async execute( card_id : string ) {

    // 1. cache에서 card_item, stat을 확인함

    // 2. 없으면 db에서 찾는다 

    // 2-1. 없을때 cache에 데이터를 입력한다. 

  }

};