import { CardAndStatReturns } from "@app/card/queries/dto";
import { GetCardMetaAndStatProps } from "@app/card/queries/usecase";
import { DtoMappingEntity } from "@app/ports/share";
import { Injectable } from "@nestjs/common";


export const CARD_NAMESPACE_ATTR = Symbol("CARD_NAMESPACE_ATTR");
export const CARD_ASSET_NAMESPACE_ATTR = Symbol("CARD_ASSET_NAMESPACE_ATTR");
export const CARD_ID_KEY_NAME_ATTR = Symbol("CARD_ID_KEY_NAME_ATTR");
export const CARD_ID_ATTRIBUTE_NAME_ATTR = Symbol("CARD_ID_ATTRIBUTE_NAME_ATTR");
export const CARD_VIEW_COUNT_ATTRIBUTE_NAME_ATTR = Symbol("CARD_VIEW_COUNT_ATTRIBUTE_NAME_ATTR");
export const CARD_VIEW_COUNT_KEY_NAME_ATTR = Symbol("CARD_VIEW_COUNT_KEY_NAME_ATTR");

@Injectable()
export class MappingCardToCardStat extends DtoMappingEntity {
  constructor() {super();};

  public mapping(dto: GetCardMetaAndStatProps) : CardAndStatReturns {
    const card = dto.card;
    const cardStat = dto.card_stat;

    return {
      card_id: card.card_id,
      category_id: card.category_id,
      thumbnail_path: card.thumbnail_path ? card.thumbnail_path : null,
      title: card.title,
      workspace_width: card.workspace_width,
      workspace_height: card.workspace_height,
      background_color: card.background_color,
      like_count: cardStat.like_count,
      view_count: cardStat.view_count
    };
  };
};