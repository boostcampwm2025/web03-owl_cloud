import { Module } from "@nestjs/common";
import { CardController } from "./card.controller";
import { AuthModule } from "../auth/auth.module";
import { CardService } from "./card.service";
import { CreateCardUsecase, UploadingCardItemUsecase } from "@app/card/commands/usecase";
import { CARD_ITEM_ASSET_NAMESPACE, CARD_ITEM_ID_ATTRIBUTE_NAME, CARD_ITEM_ID_KEY_NAME, CardIdGenerator, CardItemPathMapping } from "./card.interface";
import { DeleteCardItemAndCardAssetDataToMysql, InsertCardAndCardStateDataToMysql, InsertCardItemAndCardAssetDataToMysql, InsertCardItemDataToMysql } from "@infra/db/mysql/card/card.outbound";
import { GetMultipartUploadIdFromS3Bucket, GetPresignedUrlFromS3Bucket, GetPresignedUrlsFromS3Bucket } from "@infra/disk/s3/adapters/disk.inbound";
import { InsertCardItemAssetInitDataToRedis } from "@infra/cache/redis/card/card.outbound";
import { GetMultipartDataUrlUsecase } from "@app/card/queries/usecase";
import { CACHE_CARD_ITEM_ASSET_KEY_NAME, CACHE_CARD_NAMESPACE_NAME } from "@infra/cache/cache.constants";
import { DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME } from "@infra/db/db.constants";
import { SelectCardItemAssetFromRedis } from "@infra/cache/redis/card/card.inbound";
import { SelectCardItemAssetFromMysql } from "@infra/db/mysql/card/card.inbound";


@Module({
  imports : [
    AuthModule
  ],
  controllers : [
    CardController
  ],
  providers : [
    CardService,
    CardIdGenerator,
    CardItemPathMapping,

    // 문자열 객체
    {
      provide : CARD_ITEM_ASSET_NAMESPACE,
      useValue : CACHE_CARD_NAMESPACE_NAME.CACHE_CARD_ITEM_ASSET
    },
    {
      provide : CARD_ITEM_ID_KEY_NAME,
      useValue : CACHE_CARD_ITEM_ASSET_KEY_NAME.ITEM_ID
    },
    {
      provide : CARD_ITEM_ID_ATTRIBUTE_NAME,
      useValue : DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID
    },

    // card를 생성할때 사용하는 모듈
    {
      provide : CreateCardUsecase,
      useFactory : (
        cardIdGenrator : CardIdGenerator,
        insertCardAndCardStateToDb : InsertCardAndCardStateDataToMysql
      ) => {  
        return new CreateCardUsecase({
          cardIdGenrator, insertCardAndCardStateToDb
        });
      },
      inject : [
        CardIdGenerator, InsertCardAndCardStateDataToMysql
      ]
    },

    // card에 item을 생성할때 
    {
      provide : UploadingCardItemUsecase,
      useFactory : (
        itemIdGenerator : CardIdGenerator,
        insertCardItemToDb : InsertCardItemDataToMysql,
        insertCardItemAndCardItemAssetToDb : InsertCardItemAndCardAssetDataToMysql,
        deleteCardItemAndCardItemAssetToDb : DeleteCardItemAndCardAssetDataToMysql,
        getUploadUrlFromDisk : GetPresignedUrlFromS3Bucket,
        getMultiVerGroupIdFromDisk : GetMultipartUploadIdFromS3Bucket,
        insertCardItemAssetToCache : InsertCardItemAssetInitDataToRedis
      ) => {
        return new UploadingCardItemUsecase({
          itemIdGenerator, insertCardItemToDb, insertCardItemAndCardItemAssetToDb, deleteCardItemAndCardItemAssetToDb, getUploadUrlFromDisk, getMultiVerGroupIdFromDisk, insertCardItemAssetToCache
        });
      },
      inject : [
        CardIdGenerator,
        InsertCardItemDataToMysql,
        InsertCardItemAndCardAssetDataToMysql,
        DeleteCardItemAndCardAssetDataToMysql,
        GetPresignedUrlFromS3Bucket,
        GetMultipartUploadIdFromS3Bucket,
        InsertCardItemAssetInitDataToRedis
      ]
    },

    // card에 item에 upload_id에서 presigned_url을 받을때 
    {
      provide : GetMultipartDataUrlUsecase,
      useFactory : (
        cardAssetNamespace : string,
        itemIdKeyName : string,
        itemIdAttribute : string,
        selectCardAssetFromCache : SelectCardItemAssetFromRedis,
        selectCardAssetFromDb : SelectCardItemAssetFromMysql,
        pathMapping : CardItemPathMapping,
        getUploadUrlsFromDisk : GetPresignedUrlsFromS3Bucket,
        insertCardAssetToCache : InsertCardItemAssetInitDataToRedis
      ) => {
        return new GetMultipartDataUrlUsecase({
          usecaseValues : {
            cardAssetNamespace, itemIdKeyName, itemIdAttribute
          }, selectCardAssetFromCache, selectCardAssetFromDb, pathMapping, getUploadUrlsFromDisk, insertCardAssetToCache
        })
      }, 
      inject : [
        CARD_ITEM_ASSET_NAMESPACE,
        CARD_ITEM_ID_KEY_NAME,
        CARD_ITEM_ID_ATTRIBUTE_NAME,
        SelectCardItemAssetFromRedis,
        SelectCardItemAssetFromMysql,
        CardItemPathMapping,
        GetPresignedUrlsFromS3Bucket,
        InsertCardItemAssetInitDataToRedis
      ]
    }
    

  ],
})
export class CardModule{};