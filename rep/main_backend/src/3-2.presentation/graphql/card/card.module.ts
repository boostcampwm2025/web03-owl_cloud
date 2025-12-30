import { Module } from "@nestjs/common";
import { CardGraphqlResover } from "./card.resolver";
import { CardGraphqlService } from "./card.service";
import { CardMetaDataUsecase, GetCardItemDatasUsecase } from "@app/card/queries/usecase";
import { SelectAllCardItemAndAssetFromMysql, SelectCardAndStatFromMysql } from "@infra/db/mysql/card/card.inbound";
import { SelectCardMetaAndStatFromRedis } from "@infra/cache/redis/card/card.inbound";
import { DeleteCardAssetToRedis, DeleteCardToRedis, InsertCardAndCardStatToRedis, UpdateCardStatToRedis, UpdateCardToRedis } from "@infra/cache/redis/card/card.outbound";
import { CARD_ASSET_NAMESPACE_ATTR, CARD_ID_ATTRIBUTE_NAME_ATTR, CARD_ID_KEY_NAME_ATTR, CARD_NAMESPACE_ATTR, CARD_VIEW_COUNT_ATTRIBUTE_NAME_ATTR, CARD_VIEW_COUNT_KEY_NAME_ATTR, MappingCardToCardStat } from "./card.interface";
import { CACHE_CARD_KEY_NAME, CACHE_CARD_NAMESPACE_NAME } from "@infra/cache/cache.constants";
import { DB_CARD_STATS_ATTRIBUTE_NAME, DB_CARDS_ATTRIBUTE_NAME } from "@infra/db/db.constants";
import { GetPresingendUrlsFromAwsS3 } from "@infra/disk/s3/adapters/disk.inbound";
import { DeleteCardItemsToMySql, DeleteCardToMysql, UpdateCardItemsToMysql, UpdateCardStatToMySql, UpdateCardToMysql } from "@infra/db/mysql/card/card.outbound";
import { DeleteCardItemsUsecase, DeleteCardUsecase, UpdateCardItemsUsecase, UpdateCardUsecase } from "@app/card/commands/usecase";
import { AuthModule } from "@present/http/auth/auth.module";


@Module({
  imports : [
    AuthModule
  ],
  providers : [
    CardGraphqlResover, // controller의 역할을 하는 resolver 

    CardGraphqlService, // service의 역할을 하는 것
    MappingCardToCardStat,

    // cache에서 사용하는 card와 관련된 namespace
    {
      provide : CARD_NAMESPACE_ATTR,
      useValue : CACHE_CARD_NAMESPACE_NAME.CACHE_CARD
    },
    // cache에서 사용하는 card_id와 관련된 keyname
    {
      provide : CARD_ID_KEY_NAME_ATTR,
      useValue : CACHE_CARD_KEY_NAME.CARD_ID
    },
    // db에서 사용하는 card_id와 관련된 열이름
    {
      provide : CARD_ID_ATTRIBUTE_NAME_ATTR,
      useValue : DB_CARDS_ATTRIBUTE_NAME.CARD_ID
    },
    // db에서 사용하는 card_view_count와 관련된 열이름
    {
      provide : CARD_VIEW_COUNT_ATTRIBUTE_NAME_ATTR,
      useValue : DB_CARD_STATS_ATTRIBUTE_NAME.VIEW_COUNT
    },
    // cache에서 사용하는 view_count와 관련된 key_name 
    {
      provide : CARD_VIEW_COUNT_KEY_NAME_ATTR,
      useValue : CACHE_CARD_KEY_NAME.VIEW_COUNT
    },
    {
      provide : CARD_ASSET_NAMESPACE_ATTR,
      useValue : CACHE_CARD_NAMESPACE_NAME.CACHE_CARD_ITEM_ASSET
    },
    // usecase들 card에 meta 데이터를 보기 위한 usecase
    {
      provide : CardMetaDataUsecase,
      useFactory : (
        cardNamespace : string,
        cardIdKeyName : string,
        cardIdAttributeName : string,
        selectCardMetaAndStatFromDb : SelectCardAndStatFromMysql,  
        selectCardMetaAndStatFromCache : SelectCardMetaAndStatFromRedis, 
        insertCardMetaAndStatToCache : InsertCardAndCardStatToRedis,
        mappingCardAndStat : MappingCardToCardStat
      ) => {
        return new CardMetaDataUsecase({
          usecaseValues : {
            cardNamespace, cardIdKeyName, cardIdAttributeName
          }, selectCardMetaAndStatFromDb, selectCardMetaAndStatFromCache, insertCardMetaAndStatToCache, mappingCardAndStat
        })
      },
      inject : [
        CARD_NAMESPACE_ATTR,
        CARD_ID_KEY_NAME_ATTR,
        CARD_ID_ATTRIBUTE_NAME_ATTR,
        SelectCardAndStatFromMysql,
        SelectCardMetaAndStatFromRedis, 
        InsertCardAndCardStatToRedis,
        MappingCardToCardStat
      ]
    },

    // card에 아이템 리스트를 보기 위한 유스케이스
    {
      provide : GetCardItemDatasUsecase,
      useFactory : (
        cardIdAttribute : string,
        cardNamespace : string,
        cardViewCountAttribute : string, 
        cardViewCountKeyName : string,  
        selectCardItems : SelectAllCardItemAndAssetFromMysql,
        getUploadUrlsFromDisk : GetPresingendUrlsFromAwsS3, 
        updateCardStatToDb : UpdateCardStatToMySql,
        updateCardStatToCache : UpdateCardStatToRedis
      ) => {
        return new GetCardItemDatasUsecase({
          usecaseValues : {
            cardIdAttribute, cardNamespace, cardViewCountAttribute, cardViewCountKeyName
          }, selectCardItems, getUploadUrlsFromDisk, updateCardStatToDb, updateCardStatToCache
        })
      },
      inject : [
        CARD_ID_ATTRIBUTE_NAME_ATTR,
        CARD_NAMESPACE_ATTR,
        CARD_VIEW_COUNT_ATTRIBUTE_NAME_ATTR,
        CARD_VIEW_COUNT_KEY_NAME_ATTR,
        SelectAllCardItemAndAssetFromMysql,
        GetPresingendUrlsFromAwsS3,
        UpdateCardStatToMySql,
        UpdateCardStatToRedis
      ]
    },

    // card를 수정하기 위한 usecases
    {
      provide : UpdateCardUsecase,
      useFactory : (
        cardNamespace : string,
        updateCardToDb : UpdateCardToMysql,
        updateCardToCache : UpdateCardToRedis
      ) => {
        return new UpdateCardUsecase({
          usecaseValues : { cardNamespace }, updateCardToDb, updateCardToCache
        })
      },
      inject : [
        CARD_NAMESPACE_ATTR,
        UpdateCardToMysql,
        UpdateCardToRedis
      ]
    },

    // card를 삭제하기 위한 usecase
    {
      provide : DeleteCardUsecase,
      useFactory : (
        cardNamespace : string,
        deleteCardToDb : DeleteCardToMysql,
        deleteCardToCache : DeleteCardToRedis
      ) => {
        return new DeleteCardUsecase({
          usecaseValues : { cardNamespace }, deleteCardToDb, deleteCardToCache
        })
      },
      inject : [
        CARD_NAMESPACE_ATTR,
        DeleteCardToMysql,
        DeleteCardToRedis
      ]
    },

    // card에 item을 수정하기 위한 usecase
    {
      provide : UpdateCardItemsUsecase,
      useFactory : (
        updateCardItemsToDb : UpdateCardItemsToMysql
      ) => {
        return new UpdateCardItemsUsecase({
          updateCardItemsToDb
        });
      },
      inject : [UpdateCardItemsToMysql]
    },

    // card에 item을 삭제하기 위한 usecase
    {
      provide : DeleteCardItemsUsecase,
      useFactory : (
        cardAssetNamespace : string,
        deleteCardItemAndAssetToDb : DeleteCardItemsToMySql,
        deleteCardAssetToCache : DeleteCardAssetToRedis
      ) => {
        return new DeleteCardItemsUsecase({
          usecaseValues : {cardAssetNamespace}, deleteCardItemAndAssetToDb, deleteCardAssetToCache
        })
      },
      inject : [
        CARD_ASSET_NAMESPACE_ATTR,
        DeleteCardItemsToMySql,
        DeleteCardAssetToRedis
      ]
    }

  ]
})
export class CardGraphqlModule {};