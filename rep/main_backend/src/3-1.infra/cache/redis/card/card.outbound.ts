import { InsertDataToCache, UpdateDataToCache } from "@app/ports/cache/cache.outbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_CARD_ITEM_ASSET_KEY_NAME, CACHE_CARD_NAMESPACE_NAME, REDIS_SERVER } from "../../cache.constants";
import { InsertCardAssetDataProps } from "@app/card/commands/usecase";
import { CardItemAssetProps } from "@domain/card/vo";


@Injectable()
export class InsertCardItemAssetInitDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>
  ) { super(cache); };

  // 원래 정합성을 생각하면 watch를 써야 할지 말지 고민 중 인데 이 부분이 사실 모든 데이터를 저장하는 부분이라서 없애면 안될것 같다는 생각이 든다. 
  async insert(entity: InsertCardAssetDataProps): Promise<boolean> {
    
    const cache : RedisClientType<any, any> = this.cache;

    const cardAssetEntity : CardItemAssetProps = entity.cardAsset;

    const namespace : string = `${CACHE_CARD_NAMESPACE_NAME.CACHE_CARD_ITEM_ASSET}:${cardAssetEntity.card_id}:${cardAssetEntity.item_id}`;

    const upload_id = entity.upload_id;
    
    const tx = cache.multi();

    tx.hSet(namespace, {
      [CACHE_CARD_ITEM_ASSET_KEY_NAME.CARD_ID]: String(cardAssetEntity.card_id),
      [CACHE_CARD_ITEM_ASSET_KEY_NAME.ITEM_ID]: String(cardAssetEntity.item_id),
      [CACHE_CARD_ITEM_ASSET_KEY_NAME.KEY_NAME]: String(cardAssetEntity.key_name),
      [CACHE_CARD_ITEM_ASSET_KEY_NAME.MIME_TYPE]: String(cardAssetEntity.mime_type),
      [CACHE_CARD_ITEM_ASSET_KEY_NAME.SIZE]: String(cardAssetEntity.size),
      [CACHE_CARD_ITEM_ASSET_KEY_NAME.STATUS]: String(cardAssetEntity.status)
    })

    if ( upload_id ) tx.hSet(namespace, CACHE_CARD_ITEM_ASSET_KEY_NAME.UPLOAD_ID, upload_id);
    tx.expire(namespace, 60 * 60) // 1h 동안 저장

    const res = await tx.exec();

    return res !== null && true;
  };

};

@Injectable()
export class UpdateCardItemAssetDataToRedis extends UpdateDataToCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>,
  ) { super(cache); };

  private async updateKeyValue({
    cache, namespace, keyName, updateValue
  } : {
    cache : RedisClientType<any, any>, namespace : string, keyName : string, updateValue : any
  }) : Promise<boolean> {
    const tx = cache.multi();
    tx.hSet(namespace, keyName, updateValue);
    tx.expire(namespace, 60 * 60);
    const res = await tx.exec();
    return res !== null;
  }

  async updateKey({ namespace, keyName, updateValue }: { namespace: string; keyName: string; updateValue: any; }): Promise<boolean> {
    
    const cache = this.cache;

    // 분명히 이게 맞기는 한데...
    if ( keyName === CACHE_CARD_ITEM_ASSET_KEY_NAME.STATUS ) {
      const updateChecked : boolean = await this.updateKeyValue({ cache, namespace, keyName, updateValue });

      // 전이 규칙을 정해 놓는 것이 안전하다. 

      return updateChecked;
    } 
    // 다른 데이터는 이런식으로 정합성을 체크하고자 한다.
    else {
      await cache.watch(namespace);

      try {
        // update 확인 
        const updateChecked : boolean = await this.updateKeyValue({ cache, namespace, keyName, updateValue });
        return updateChecked;
      } finally {
        await cache.unwatch();
      };
    };
  };

};