import { CardMetaDataUsecase, GetCardItemDatasUsecase } from "@app/card/queries/usecase";
import { HttpException, Injectable } from "@nestjs/common";
import { Card, CardItem, CardItemAssetStatusType, CardItemType } from "./card.types";


@Injectable()
export class CardGraphqlService {

  constructor(
    private readonly cardMetaDataUsecase : CardMetaDataUsecase<any, any>,
    private readonly getCardItemUsecase : GetCardItemDatasUsecase<any, any, any>,
  ) {};

  async cardService(card_id : string) : Promise<Card> {
    try { 
      const cardEntity = await this.cardMetaDataUsecase.execute(card_id);
      return {
        ...cardEntity,
        card_items : []
      };
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  };

  // card_type을 enum으로 변형 시켜야 함
  private toCardItemType(type : "text" | "image" | "video") : CardItemType {
    switch (type) {
      case "text":
        return CardItemType.TEXT;
      case "image":
        return CardItemType.IMAGE;
      case "video":
        return CardItemType.VIDEO;
    }
  }

  // card_status를 enum으로 변경시켜야 함
  private toAssetStatusEnum(status: "uploading" | "ready" | "failed") : CardItemAssetStatusType {
    switch (status) {
      case "uploading":
        return CardItemAssetStatusType.UPLOADING;
      case "failed":
        return CardItemAssetStatusType.FAILED;
      case "ready":
        return CardItemAssetStatusType.READY;
    };
  }

  async cardItemService(card_id : string) : Promise<CardItem[]> {
    try {
      const cardItemDatas = await this.getCardItemUsecase.execute(card_id);

      return cardItemDatas.map((cardItemData) => {
        
        // enum으로 변경
        const cardType = this.toCardItemType(cardItemData.type);

        // text는 바로 반환
        if ( cardItemData.type === "text" ) {
          return {
            ...cardItemData,
            type : cardType,
            card_asset : null
          }
        };

        // asset을 반환 
        if ( !cardItemData.card_asset ) {
          return {
            ...cardItemData,
            type : cardType,
            card_asset : null
          };
        };

        return {
          ...cardItemData,
          type : cardType,
          card_asset : {
            item_id : cardItemData.card_asset.item_id,
            path : cardItemData.card_asset.path,
            status : this.toAssetStatusEnum(cardItemData.card_asset.status)
          } 
        };
      });
    } catch(err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }

};