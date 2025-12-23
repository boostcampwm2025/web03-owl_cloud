import { CardAggregate } from "@domain/card/card.aggregate";
import { Card } from "@domain/card/entities";
import { AfterCreateCardItemDataInfo, CreateCardItemDataDto } from "@app/card/commands/dto";
import { IdGenerator } from "@domain/shared";
import { CardItemAssetProps, CardItemProps } from "@domain/card/vo";
import { NotAllowCreateCardItemNotUploadInfo, NotCreateCardItemData } from "@error/application/card/card.error";
import { DeleteValueToDb, InsertValueToDb } from "@app/ports/db/db.outbound";
import { GetMultiPartVerGroupIdFromDisk, GetUploadUrlFromDisk } from "@/2.application/ports/disk/disk.inbound";
import { Injectable } from "@nestjs/common";


type UploadCardItemUsecaseProps<T, ET> = {
  itemIdGenerator : IdGenerator;
  insertCardItemToDb : InsertValueToDb<T>;
  insertCardItemAndCardItemAssetToDb : InsertValueToDb<T>;
  deleteCardItemAndCardItemAssetToDb : DeleteValueToDb<T>;
  getUploadUrlFromDisk : GetUploadUrlFromDisk<ET>;
  getMultiVerGroupIdFromDisk : GetMultiPartVerGroupIdFromDisk<ET>;
};

export type InsertCardItemAndAssetDataProps = {
  cardItem : Required<CardItemProps>;
  cardAsset : Required<CardItemAssetProps>;
};

@Injectable()
export class UploadingCardItemUsecase<T, ET> {

  private readonly itemIdGenerator : UploadCardItemUsecaseProps<T, ET>["itemIdGenerator"];
  private readonly insertCardItemToDb : UploadCardItemUsecaseProps<T, ET>["insertCardItemToDb"];
  private readonly insertCardItemAndCardItemAssetToDb : UploadCardItemUsecaseProps<T, ET>["insertCardItemAndCardItemAssetToDb"];
  private readonly deleteCardItemAndCardItemAssetToDb : UploadCardItemUsecaseProps<T, ET>["deleteCardItemAndCardItemAssetToDb"];
  private readonly getUploadUrlFromDisk : UploadCardItemUsecaseProps<T, ET>["getUploadUrlFromDisk"];
  private readonly getMultiVerGroupIdFromDisk : UploadCardItemUsecaseProps<T, ET>["getMultiVerGroupIdFromDisk"];

  constructor({
    itemIdGenerator, insertCardItemToDb, insertCardItemAndCardItemAssetToDb, deleteCardItemAndCardItemAssetToDb, getUploadUrlFromDisk, getMultiVerGroupIdFromDisk
  } : UploadCardItemUsecaseProps<T, ET>) {
    this.itemIdGenerator = itemIdGenerator;
    this.insertCardItemToDb = insertCardItemToDb;
    this.insertCardItemAndCardItemAssetToDb = insertCardItemAndCardItemAssetToDb;
    this.deleteCardItemAndCardItemAssetToDb = deleteCardItemAndCardItemAssetToDb;
    this.getUploadUrlFromDisk = getUploadUrlFromDisk;
    this.getMultiVerGroupIdFromDisk = getMultiVerGroupIdFromDisk;
  };

  async execute(dto : CreateCardItemDataDto) : Promise<AfterCreateCardItemDataInfo> {

    // 1. 정합성 파악을 위한 초석
    const cardAggregate = new CardAggregate({ 
      card : new Card({ 
        card_id : dto.card_id,
        // 여기서 부터 더미데이터
        user_id : '018e9a48-3c8a-7b20-bc9d-9f5b8e9f88c0',
        category_id : 1,
        thumbnail_path : "thumbnail.png",
        status : "archived",
        title : "나의 취미는",
        workspace_height : 100,
        workspace_width : 100,
        background_color : "#ffcc00"
      })
    }) // card_id 말고 나머지는 더미데이터

    // text인 경우 asset이 필요없고 바로 저장
    if ( dto.type === "text" ) {
      // 2. card_item 정합성 체크
      const newCardAggregate = cardAggregate.addCardItem({ 
        input : {
          type: dto.type,
          x: dto.x,
          y: dto.y,
          width: dto.width,
          height: dto.height,
          rotation: dto.rotation || 0,
          scale_x: dto.scale_x || 1.000,
          scale_y: dto.scale_y || 1.000,
          opacity: dto.opacity,
          z_index: dto.z_index,
          is_locked: dto.is_locked,
          is_visible: dto.is_visible,
          name: dto.name,
          option: dto.option,
        },
        itemIdGenerator : this.itemIdGenerator
      });
      const cardItem : Required<CardItemProps> | undefined = newCardAggregate.getCardItems().at(-1)?.getData();
      if ( !cardItem ) throw new NotCreateCardItemData();

      // 3. 데이터 저장
      const insertChecked : boolean = await this.insertCardItemToDb.insert(cardItem);
      if ( !insertChecked ) throw new NotCreateCardItemData();
      
      // 4. item_id 반환
      const returnDto : AfterCreateCardItemDataInfo = {
        item_id : cardItem.item_id
      };
      return returnDto;
    } else {
      // 정합성 파악
      if ( !dto.file_info?.size ) throw new NotAllowCreateCardItemNotUploadInfo();
      const newCardAggregate = cardAggregate.addCardItemAndAsset({
        cardItemInput : {
          type: dto.type,
          x: dto.x,
          y: dto.y,
          width: dto.width,
          height: dto.height,
          rotation: dto.rotation || 0,
          scale_x: dto.scale_x || 1.000,
          scale_y: dto.scale_y || 1.000,
          opacity: dto.opacity,
          z_index: dto.z_index,
          is_locked: dto.is_locked,
          is_visible: dto.is_visible,
          name: dto.name,
          option: dto.option,
        },
        cardItemAssetInput : {
          key_name : dto.file_info.path,
          mime_type : dto.file_info.mime_type,
          size : dto.file_info.size
        },
        itemIdGenerator : this.itemIdGenerator
      });
      const cardItem : Required<CardItemProps> | undefined = newCardAggregate.getCardItems().at(-1)?.getData();
      const cardAsset : Required<CardItemAssetProps> | undefined = newCardAggregate.getCardItemAssets().at(-1)?.getData();
      if ( !cardItem || !cardAsset ) throw new NotCreateCardItemData();

      // 2. 데이터 저장
      const insertEntity : InsertCardItemAndAssetDataProps = {
        cardItem, cardAsset
      };
      const insertChecked : boolean = await this.insertCardItemAndCardItemAssetToDb.insert(insertEntity);
      if ( !insertChecked ) throw new NotCreateCardItemData();

      // 본격적인 파일 저장을 위한 요청
      try {
        // cache에 저장하여 안정성을 높이는 선택도 필요하다. -> 곧 추가

        // 10mb 이하
        if ( dto.file_info.size <= 10 ) {
          // 3. presigned_url 발급
          const upload_url : string = await this.getUploadUrlFromDisk.getUrl({ pathName : [
            cardItem.card_id, 
            cardItem.item_id, 
            dto.file_info.path
          ], mime_type : cardAsset.mime_type });

          // 4. item_id, presigned_url 반환
          const returnDto : AfterCreateCardItemDataInfo = {
            item_id : cardItem.item_id , mini : {upload_url}};
          return returnDto;
        } else {
          // 3. upload_id, part_size 
          const upload_id : string = await this.getMultiVerGroupIdFromDisk.getMultiId({ pathName : [
            cardItem.card_id, 
            cardItem.item_id, 
            dto.file_info.path
          ], mime_type : cardAsset.mime_type });

          // 4. item_id, upload_id, part_size 반환
          const returnDto : AfterCreateCardItemDataInfo = {
            item_id : cardItem.item_id, big : { upload_id, part_size : 10 }
          };
          return returnDto;
        }
      } catch (err) {
        // 문제가 발생하면 db에서 데이터 제거
        await this.deleteCardItemAndCardItemAssetToDb.delete({ uniqueValue : cardItem.item_id, addOption : undefined });
        throw new NotCreateCardItemData();
      }
    };
  };

};