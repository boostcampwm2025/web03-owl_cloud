import { type CardStateProps, type CardProps } from "@domain/card/vo";
import { SelectDatasFromCache } from "@app/ports/cache/cache.inbound";
import { InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { Injectable } from "@nestjs/common";
import { DontGetCardAndStatData } from "@error/application/card/card.error";
import { DtoMappingEntity } from "@app/ports/share/dto-mapping";
import { CardAndStatReturns } from "../dto";


type CardMetaUsecaseValues = {
  cardNamespace : string;
  cardStatNamespace : string;
  cardIdAttributeName : string;
};

type CardMetaUsecaseProps<T, CT> = {
  usecaseValues : CardMetaUsecaseValues;
  selectCardMetaAndStatFromDb : SelectDataFromDb<T>; // card, stat 데이터를 db에서 받아오는 로직 
  selectCardMetaAndStatFromCache : SelectDatasFromCache<CT>; // card_ stat 데이터를 cache에서 받아오는 로직 
  insertCardMetaAndStatToCache : InsertDataToCache<CT>; // card, stat 데이터를 cache로 저장하기
  mappingCardAndStat : DtoMappingEntity // mapping을 위한 port
};

export type GetCardMetaAndStatProps = {
  card : CardProps;
  card_stat : CardStateProps;
};

@Injectable()
export class CardMetaDataUsecase<T, CT> {

  private readonly usecaseValues : CardMetaUsecaseProps<T, CT>["usecaseValues"];
  private readonly selectCardMetaAndStatFromDb : CardMetaUsecaseProps<T, CT>["selectCardMetaAndStatFromDb"];
  private readonly selectCardMetaAndStatFromCache : CardMetaUsecaseProps<T, CT>["selectCardMetaAndStatFromCache"];
  private readonly insertCardMetaAndStatToCache : CardMetaUsecaseProps<T, CT>["insertCardMetaAndStatToCache"];
  private readonly mappingCardAndStat : CardMetaUsecaseProps<T, CT>["mappingCardAndStat"];

  constructor({
    usecaseValues, selectCardMetaAndStatFromDb,  selectCardMetaAndStatFromCache, insertCardMetaAndStatToCache, mappingCardAndStat
  } : CardMetaUsecaseProps<T, CT>) {
    this.usecaseValues = usecaseValues;
    this.selectCardMetaAndStatFromDb = selectCardMetaAndStatFromDb;
    this.selectCardMetaAndStatFromCache = selectCardMetaAndStatFromCache;
    this.insertCardMetaAndStatToCache = insertCardMetaAndStatToCache;
    this.mappingCardAndStat = mappingCardAndStat;
  }

  async execute( card_id : string ) : Promise<CardAndStatReturns> {

    // 찾아야 하는 card, card_stat 
    let cardAndStatProps : GetCardMetaAndStatProps | undefined;

    // 1. cache에서 card_item, stat을 확인함
    const namespaces : Array<string> = [
      `${this.usecaseValues.cardNamespace}:${card_id}`,
      `${this.usecaseValues.cardStatNamespace}:${card_id}`
    ]; // card 관련 card_stat관련 cache 찾기
    cardAndStatProps  = await this.selectCardMetaAndStatFromCache.selects({ namespaces });
    if ( !cardAndStatProps ) {
      // 2. 없으면 db에서 찾는다 
      cardAndStatProps = await this.selectCardMetaAndStatFromDb.select({ 
        attributeName : this.usecaseValues.cardIdAttributeName, attributeValue : card_id
      })
      if ( !cardAndStatProps ) throw new DontGetCardAndStatData();

      // 2-1. 없을때 cache에 데이터를 입력한다. 
      await this.insertCardMetaAndStatToCache.insert(cardAndStatProps);
    }

    // 해당 carddto를 원하는 모양으로 mapping 시키기 
    const cardAndStatData : CardAndStatReturns = this.mappingCardAndStat.mapping(cardAndStatProps);

    return cardAndStatData;
  }

};