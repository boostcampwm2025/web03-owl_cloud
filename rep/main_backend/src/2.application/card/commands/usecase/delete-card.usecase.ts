// card_id가 들어왔을때 soft 삭제를 한다.
import { DeleteDataToCache } from "@app/ports/cache/cache.outbound";
import { DeleteValueToDb } from "@app/ports/db/db.outbound";
import { Injectable } from "@nestjs/common";


type DeleteCardUsecaseValues = {
  cardNamespace : string;
};

type DeleteCardUsecaseProps<T, CT> = {
  usecaseValues : DeleteCardUsecaseValues;
  deleteCardToDb : DeleteValueToDb<T>;
  deleteCardToCache : DeleteDataToCache<CT>;
};

@Injectable()
export class DeleteCardUsecase<T, CT> {

  private readonly usecaseValues : DeleteCardUsecaseProps<T, CT>["usecaseValues"];
  private readonly deleteCardToDb : DeleteCardUsecaseProps<T, CT>["deleteCardToDb"];
  private readonly deleteCardToCache : DeleteCardUsecaseProps<T, CT>["deleteCardToCache"];

  constructor({
    usecaseValues, deleteCardToDb, deleteCardToCache
  } : DeleteCardUsecaseProps<T, CT>) {
    this.usecaseValues = usecaseValues;
    this.deleteCardToDb = deleteCardToDb;
    this.deleteCardToCache = deleteCardToCache;
  }

  async execute( card_id : string ) : Promise<void> {

    // 1. db에서 card_id에 해당하는 데이터를 소프트 삭제
    await this.deleteCardToDb.delete({ uniqueValue : card_id, addOption : undefined });

    // 2. cache에서 card_id에 해당하는 card를 삭제 ( asset은 남기자 상관없기는 하다. )
    const namespace : string = `${this.usecaseValues.cardNamespace}:${card_id}`;
    await this.deleteCardToCache.deleteNamespace(namespace);

  }

};