import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { Inject, Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { CACHE_CARD_ITEM_ASSET_KEY_NAME, CACHE_CARD_KEY_NAME, REDIS_SERVER } from "../../cache.constants";
import { CardItemAssetProps, cardItemAssetStatusList, CardItemAssetStatusProps, CardProps, CardStateProps } from "@domain/card/vo";
import { GetCardMetaAndStatProps } from "@app/card/queries/usecase";
import { Card } from "@domain/card/entities";


@Injectable()
export class SelectCardItemAssetFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>
  ) { super(cache); };

  private isStatusValue(value : unknown) : value is CardItemAssetStatusProps {
    return (
      typeof value === "string" && 
      ( cardItemAssetStatusList as readonly string[] ).includes(value)
    )
  }

  async select({ namespace, keyName }: { namespace: string; keyName: string; }): Promise<Required<CardItemAssetProps> | undefined> {
    
    const cache = this.cache;

    const cardItemAsset = await cache.hGetAll(namespace);

    if ( !cardItemAsset || Object.keys(cardItemAsset).length === 0 ) return undefined;

    const card_id = cardItemAsset[CACHE_CARD_ITEM_ASSET_KEY_NAME.CARD_ID];
    const item_id = cardItemAsset[CACHE_CARD_ITEM_ASSET_KEY_NAME.ITEM_ID];
    const key_name = cardItemAsset[CACHE_CARD_ITEM_ASSET_KEY_NAME.KEY_NAME];
    const mime_type = cardItemAsset[CACHE_CARD_ITEM_ASSET_KEY_NAME.MIME_TYPE];
    const size = Number(cardItemAsset[CACHE_CARD_ITEM_ASSET_KEY_NAME.SIZE]);

    // 값이 없다면 undefined를 반환한다.
    if (!card_id || !item_id || !key_name || !mime_type || size === undefined)
      return undefined;

    const status = cardItemAsset[CACHE_CARD_ITEM_ASSET_KEY_NAME.STATUS];
    if ( !this.isStatusValue(status) ) return undefined;

    const now = new Date();
    return {
      card_id, item_id, key_name, mime_type, size, status, created_at : now, updated_at : now
    };
  };

};

@Injectable()
export class SelectCardMetaAndStatFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {

  constructor(
    @Inject(REDIS_SERVER) cache : RedisClientType<any, any>
  ) { super(cache); };

  async select({ namespace, keyName, }: { namespace: string; keyName: string; }): Promise<GetCardMetaAndStatProps | undefined> {
    
    const card = await this.cache.hGetAll(namespace); // 일단 데이터 가져오기 

    // 데이터들 정렬
    const card_id : string = card[CACHE_CARD_KEY_NAME.CARD_ID];
    const user_id : string = card[CACHE_CARD_KEY_NAME.USER_ID];
    const status : string = card[CACHE_CARD_KEY_NAME.STATUS];
    const category_id_str : string = card[CACHE_CARD_KEY_NAME.CATEGORY_ID];
    const thumbnail_path : string | undefined = card[CACHE_CARD_KEY_NAME.THUMBNAIL_PATH];
    const title : string = card[CACHE_CARD_KEY_NAME.TITLE];
    const workspace_width_str : string = card[CACHE_CARD_KEY_NAME.WORKSPACE_WIDTH];
    const workspace_height_str : string = card[CACHE_CARD_KEY_NAME.WORKSPACE_HEIGHT];
    const background_color : string = card[CACHE_CARD_KEY_NAME.BACKGROUND_COLOR];
    const like_count_str : string = card[CACHE_CARD_KEY_NAME.LIKE_COUNT];
    const view_count_str : string = card[CACHE_CARD_KEY_NAME.VIEW_COUNT];
  
    if ( !card_id || !user_id || !status || !category_id_str || !title || !workspace_width_str || !workspace_height_str || !background_color || !like_count_str || !view_count_str ) return undefined;

    // 숫자로 변환
    const category_id : number = Number(category_id_str);
    const workspace_width : number = Number(workspace_width_str);
    const workspace_height : number = Number(workspace_height_str);
    const like_count : number = Number(like_count_str);
    const view_count : number = Number(view_count_str);

    const cardData : CardProps = {
      card_id, user_id, category_id, thumbnail_path, title, workspace_width, workspace_height, background_color, status : status as "published" | "draft" | "archived" 
    };
    const cardStatData : CardStateProps = {
      card_id, like_count, view_count, id : 1
    };

    return { card : cardData, card_stat : cardStatData };
  };

};