import { Module } from "@nestjs/common";
import { CardController } from "./card.controller";
import { AuthModule } from "../auth/auth.module";
import { CardService } from "./card.service";
import { CheckCardItemDatasUsecase, CheckCardItemDataUsecase, CreateCardUsecase, UpdateCardItemDataUsecase, UploadingCardItemUsecase } from "@app/card/commands/usecase";
import { CARD_ITEM_ASSET_NAMESPACE, CARD_ITEM_ID_ATTRIBUTE_NAME, CARD_ITEM_ID_KEY_NAME, CARD_ITEM_STATUS_ATTRIBUTE_NAME, CARD_ITEM_STATUS_KEY_NAME, CardIdGenerator, CardItemPathMapping } from "./card.interface";
import { DeleteCardItemAndCardAssetDataToMysql, InsertCardAndCardStateDataToMysql, InsertCardItemAndCardAssetDataToMysql, InsertCardItemDataToMysql, UpdateCardItemAssetDataToMysql, UpdateCardItemAssetEntityToMySql } from "@infra/db/mysql/card/card.outbound";
import { CheckPresignedUrlFromAwsS3, CheckUploadDatasFromAwsS3, GetCompleteMultipartTagsFromAwsS3, GetMultipartUploadIdFromS3Bucket, GetPresignedUrlFromS3Bucket, GetPresignedUrlsFromS3Bucket } from "@infra/disk/s3/adapters/disk.inbound";
import { InsertCardItemAssetInitDataToRedis, UpdateCardItemAssetDataToRedis, UpdateCardItemAssetEntityToRedis } from "@infra/cache/redis/card/card.outbound";
import { GetMultipartDataUrlUsecase } from "@app/card/queries/usecase";
import { CACHE_CARD_ITEM_ASSET_KEY_NAME, CACHE_CARD_NAMESPACE_NAME } from "@infra/cache/cache.constants";
import { DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME } from "@infra/db/db.constants";
import { SelectCardItemAssetFromRedis } from "@infra/cache/redis/card/card.inbound";
import { SelectCardItemAssetFromMysql } from "@infra/db/mysql/card/card.inbound";
import { CompleteUploadToAwsS3 } from "@/3-1.infra/disk/s3/adapters/disk.outbound";


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
    {
      provide : CARD_ITEM_STATUS_ATTRIBUTE_NAME,
      useValue : DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS
    },
    {
      provide : CARD_ITEM_STATUS_KEY_NAME,
      useValue : CACHE_CARD_ITEM_ASSET_KEY_NAME.STATUS
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

    // card에 item에 upload_id에서 presigned_url을 받을때 (10mb 이상)
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
    },

    // card_item에 데이터가 제대로 업로드가 되었는지 확인하는 로직
    {
      provide : CheckCardItemDataUsecase,
      useFactory : (
        cardAssetNamespace : string,
        itemIdKeyName : string,
        itemIdAttribute : string,  
        statusColName : string,
        statusKeyName : string,
        selectCardAssetFromCache : SelectCardItemAssetFromRedis,
        selectCardAssetFromDb : SelectCardItemAssetFromMysql,
        insertCardAssetToCache : InsertCardItemAssetInitDataToRedis,
        pathMapping : CardItemPathMapping,
        checkUploadFromDisk : CheckPresignedUrlFromAwsS3,
        updateCardAssetToDb : UpdateCardItemAssetDataToMysql,
        updateCardAssetToCache : UpdateCardItemAssetDataToRedis
      ) => {
        return new CheckCardItemDataUsecase({
          usecaseValues : {
            cardAssetNamespace, itemIdKeyName, itemIdAttribute, statusColName, statusKeyName
          }, selectCardAssetFromCache, selectCardAssetFromDb, insertCardAssetToCache, pathMapping, checkUploadFromDisk, updateCardAssetToDb, updateCardAssetToCache
        })
      },
      inject : [
        CARD_ITEM_ASSET_NAMESPACE,
        CARD_ITEM_ID_KEY_NAME,
        CARD_ITEM_ID_ATTRIBUTE_NAME,
        CARD_ITEM_STATUS_ATTRIBUTE_NAME,
        CARD_ITEM_STATUS_KEY_NAME,
        SelectCardItemAssetFromRedis,
        SelectCardItemAssetFromMysql,
        InsertCardItemAssetInitDataToRedis,
        CardItemPathMapping,
        CheckPresignedUrlFromAwsS3,
        UpdateCardItemAssetDataToMysql,
        UpdateCardItemAssetDataToRedis
      ]
    },

    // 10mb 이상의 파일에 경우 이를 통해서 확인
    {
      provide : CheckCardItemDatasUsecase,
      useFactory : (
        cardAssetNamespace : string,
        itemIdKeyName : string,
        itemIdAttribute : string,  
        statusColName : string,
        statusKeyName : string,
        selectCardAssetFromCache : SelectCardItemAssetFromRedis,
        selectCardAssetFromDb : SelectCardItemAssetFromMysql,
        insertCardAssetToCache : InsertCardItemAssetInitDataToRedis,
        pathMapping : CardItemPathMapping,
        checkUploadFromDisk : CheckUploadDatasFromAwsS3,
        completeUploadToDisk : CompleteUploadToAwsS3,
        updateCardAssetToDb : UpdateCardItemAssetDataToMysql,
        updateCardAssetToCache : UpdateCardItemAssetDataToRedis 
      ) => {
        return new CheckCardItemDatasUsecase({
          usecaseValues : {
            cardAssetNamespace, itemIdKeyName, itemIdAttribute, statusColName, statusKeyName
          }, selectCardAssetFromCache, selectCardAssetFromDb, insertCardAssetToCache, pathMapping, checkUploadFromDisk, completeUploadToDisk, updateCardAssetToDb, updateCardAssetToCache
        })
      },
      inject : [
        CARD_ITEM_ASSET_NAMESPACE,
        CARD_ITEM_ID_KEY_NAME,
        CARD_ITEM_ID_ATTRIBUTE_NAME,
        CARD_ITEM_STATUS_ATTRIBUTE_NAME,
        CARD_ITEM_STATUS_KEY_NAME,
        SelectCardItemAssetFromRedis,
        SelectCardItemAssetFromMysql,
        InsertCardItemAssetInitDataToRedis,
        CardItemPathMapping,
        CheckUploadDatasFromAwsS3,
        CompleteUploadToAwsS3,
        UpdateCardItemAssetDataToMysql,
        UpdateCardItemAssetDataToRedis
      ]
    },
    
    // 파일의 내용을 변경하고 싶을때 사용하는 module
    {
      provide : UpdateCardItemDataUsecase,
      useFactory : (
        cardAssetNamespace : string,
        itemIdKeyName : string, 
        itemIdAttribute : string,
        selectCardAssetFromCache : SelectCardItemAssetFromRedis,
        selectCardAssetFromDb : SelectCardItemAssetFromMysql,
        insertCardAssetToCache : InsertCardItemAssetInitDataToRedis,
        getUploadUrlFromDisk : GetPresignedUrlFromS3Bucket,
        getCompleteUploadUrlFromDisk : GetCompleteMultipartTagsFromAwsS3,
        getMultiVerGroupIdFromDisk : GetMultipartUploadIdFromS3Bucket,
        updateCardAssetToDb : UpdateCardItemAssetEntityToMySql,
        updateCardAssetToCache : UpdateCardItemAssetEntityToRedis
      ) => {
        return new UpdateCardItemDataUsecase({
          usecaseValues : {
            cardAssetNamespace, itemIdKeyName, itemIdAttribute
          }, selectCardAssetFromCache, selectCardAssetFromDb, insertCardAssetToCache, getUploadUrlFromDisk, getCompleteUploadUrlFromDisk, getMultiVerGroupIdFromDisk, updateCardAssetToDb, updateCardAssetToCache
        })
      },
      inject : [
        CARD_ITEM_ASSET_NAMESPACE,
        CARD_ITEM_ID_KEY_NAME,
        CARD_ITEM_ID_ATTRIBUTE_NAME,
        SelectCardItemAssetFromRedis,
        SelectCardItemAssetFromMysql,
        InsertCardItemAssetInitDataToRedis,
        GetPresignedUrlFromS3Bucket,
        GetCompleteMultipartTagsFromAwsS3,
        GetMultipartUploadIdFromS3Bucket,
        UpdateCardItemAssetEntityToMySql,
        UpdateCardItemAssetEntityToRedis
      ]
    },
  ],
})
export class CardModule{};