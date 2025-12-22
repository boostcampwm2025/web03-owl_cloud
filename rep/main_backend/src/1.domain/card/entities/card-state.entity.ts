import { idVo } from "@domain/shared";
import { cardIdVo, CardStateProps, likeCountVo, viewCountVo } from "../vo";


export class CardState {
  private readonly id : CardStateProps["id"];
  private readonly card_id : CardStateProps["card_id"];
  private readonly like_count : CardStateProps["like_count"];
  private readonly view_count : CardStateProps["view_count"];
  private readonly created_at : Exclude<CardStateProps["created_at"], undefined>;
  private readonly updated_at : Exclude<CardStateProps["updated_at"], undefined>;

  constructor({ 
    id, card_id, like_count, view_count, created_at, updated_at
  } : CardStateProps) {
    this.id = idVo(id);
    card_id = cardIdVo(card_id);
    like_count = likeCountVo(like_count);
    view_count = viewCountVo(view_count);
    created_at = created_at && created_at instanceof Date ? created_at : new Date();
    updated_at = updated_at && updated_at instanceof Date ? updated_at : new Date();

    Object.freeze(this);
  };

  getId() : CardStateProps["id"] { return this.id; };
  getCardId() : CardStateProps["card_id"] { return this.card_id; };
  getLikeCount() : CardStateProps["like_count"] { return this.like_count; };
  getViewCount() : CardStateProps["view_count"] { return this.view_count; };
  getCreatedAt() : Exclude<CardStateProps["created_at"], undefined> { return this.created_at; };
  getUpdatedAt() : Exclude<CardStateProps["updated_at"], undefined> { return this.updated_at; };

  getData() : Required<CardStateProps> {
    return {
      id : this.id,
      card_id : this.card_id,
      like_count : this.like_count,
      view_count : this.view_count,
      created_at : this.created_at,
      updated_at : this.updated_at
    };
  };

};