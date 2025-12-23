import { NotAllowCreateCardItemCheckType } from '@error/domain/card/card.error';
import { IdGenerator } from '../shared';
import { Card, CardItem, CardItemAsset, CardState } from './entities';
import { CardItemAssetProps, CardItemProps, CardProps } from './vo';

type CreateCardInput = Omit<
  CardProps,
  'card_id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

type CreateCardItemInput = Omit<
  CardItemProps,
  'card_id' | 'item_id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

type CreateCardItemAssetInput = Omit<
  CardItemAssetProps,
  'item_id' | "status" | 'created_at' | 'updated_at' | 'deleted_at'
>;

export class CardAggregate {
  private readonly card: Card;
  private readonly card_stat?: CardState;
  private readonly cardItems: readonly CardItem[];
  private readonly cardItemAssets: readonly CardItemAsset[];

  constructor({
    card,
    card_stat,
    cardItems = [],
    cardItemAssets = [],
  }: {
    card: Card;
    card_stat?: CardState;
    cardItems?: CardItem[];
    cardItemAssets?: CardItemAsset[];
  }) {
    this.card = card;
    this.card_stat = card_stat;
    this.cardItems = Object.freeze([...cardItems]);
    this.cardItemAssets = Object.freeze([...cardItemAssets]);
    Object.freeze(this);
  }

  public static createCard({
    input,
    cardIdGenerator,
  }: {
    input: CreateCardInput;
    cardIdGenerator: IdGenerator;
  }): CardAggregate {
    const card_id: string = cardIdGenerator.generate();

    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
    );

    const card = new Card({
      card_id,
      user_id: input.user_id,
      category_id: input.category_id,
      thumbnail_path: input.thumbnail_path,
      status: input.status,
      title: input.title,
      workspace_width: input.workspace_width,
      workspace_height: input.workspace_height,
      background_color: input.background_color,
      created_at: now,
      updated_at: now,
    });

    const card_stat = new CardState({
      id: 0,
      card_id,
      view_count: 0,
      like_count: 0,
      created_at: now,
      updated_at: now,
    });

    return new CardAggregate({ card, card_stat });
  }

  public addCardItem({
    input,
    itemIdGenerator,
  }: {
    input: CreateCardItemInput;
    itemIdGenerator: IdGenerator;
  }): CardAggregate {
    // text 제외 다른 타입이면 여기로 들어올 수는 없음
    if (input.type !== 'text') throw new NotAllowCreateCardItemCheckType();

    const cardItem = new CardItem({
      item_id: itemIdGenerator.generate(),
      card_id: this.card.getCardId(),
      type: input.type,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      rotation: input.rotation,
      scale_x: input.scale_x,
      scale_y: input.scale_y,
      opacity: input.opacity,
      z_index: input.z_index,
      is_locked: input.is_locked,
      is_visible: input.is_visible,
      name: input.name,
      option: input.option,
    });

    return new CardAggregate({
      card: this.card,
      cardItems: [...this.cardItems, cardItem],
    });
  }

  public addCardItemAndAsset({
    cardItemInput,
    cardItemAssetInput,
    itemIdGenerator,
  }: {
    cardItemInput: CreateCardItemInput;
    cardItemAssetInput: CreateCardItemAssetInput;
    itemIdGenerator: IdGenerator;
  }) {
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
    );

    const item_id: string = itemIdGenerator.generate();

    const cardItem = new CardItem({
      item_id,
      card_id: this.card.getCardId(),
      type: cardItemInput.type,
      x: cardItemInput.x,
      y: cardItemInput.y,
      width: cardItemInput.width,
      height: cardItemInput.height,
      rotation: cardItemInput.rotation,
      scale_x: cardItemInput.scale_x,
      scale_y: cardItemInput.scale_y,
      opacity: cardItemInput.opacity,
      z_index: cardItemInput.z_index,
      is_locked: cardItemInput.is_locked,
      is_visible: cardItemInput.is_visible,
      name: cardItemInput.name,
      option: cardItemInput.option,
      created_at: now,
      updated_at: now,
    });

    const cardItemAsset = new CardItemAsset({
      item_id,
      key_name: cardItemAssetInput.key_name,
      mime_type: cardItemAssetInput.mime_type,
      size: cardItemAssetInput.size,
      status: "uploading",
      created_at: now,
      updated_at: now,
    });

    return new CardAggregate({
      card: this.card,
      cardItems: [...this.cardItems, cardItem],
      cardItemAssets: [...this.cardItemAssets, cardItemAsset],
    });
  }

  public getCard(): Card {
    return this.card;
  }
  public getCardData(): Required<CardProps> {
    return this.card.getData();
  }
  public getCardItems(): readonly CardItem[] {
    return this.cardItems;
  }
  public getCardItemAssets(): readonly CardItemAsset[] {
    return this.cardItemAssets;
  }
  public getCardState(): CardState | undefined {
    return this.card_stat;
  }
}
