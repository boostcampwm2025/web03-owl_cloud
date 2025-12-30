import { CardMetaDataUsecase, GetCardItemDatasUsecase } from "@app/card/queries/usecase";
import { HttpException, Injectable } from "@nestjs/common";
import { Card, CardItem, CardItemAssetStatusType, CardItemType, DeleteCardItemInput, DeleteCardItemOuput, UpdateCardItemInput, UpdateCardItemOutput } from "./card.types";
import { DeleteCardItemsUsecase, UpdateCardItemsUsecase } from "@app/card/commands/usecase";


@Injectable()
export class CardGraphqlService {

  constructor(
    private readonly cardMetaDataUsecase : CardMetaDataUsecase<any, any>,
    private readonly getCardItemUsecase : GetCardItemDatasUsecase<any, any, any>,
    private readonly updateCardItemUsecase : UpdateCardItemsUsecase<any>,
    private readonly deleteCardItemsUsecase : DeleteCardItemsUsecase<any, any>
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

  // card_item리스트를 보기 위한 로직
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

  // card_item의 정보를 수정할때 사용하는 service
  async updateCardItemsService(input : UpdateCardItemInput[]) : Promise<UpdateCardItemOutput> {
    try {
      await this.updateCardItemUsecase.execute(input);
      return { ok : true };
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
    };
  }

  // card_item의 정보를 삭제할때 사용하는 service 
  async deleteCardItemsService(inputs : DeleteCardItemInput) : Promise<DeleteCardItemOuput> {
    try {
      await this.deleteCardItemsUsecase.execute(inputs);
      return { ok : true };
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
  }

};