import {
  cardIdVo,
  cardItemIsLockedVo,
  cardItemIsVisibleVo,
  cardItemNameVo,
  cardItemOpacityVo,
  cardItemOptionVo,
  cardItemPositionVo,
  CardItemProps,
  cardItemRotationVo,
  cardItemScaleVo,
  cardItemSizeVo,
  cardItemTypeVo,
  cardItemZindexVo,
  itemIdVo,
} from '@domain/card/vo';

export class CardItem {
  private readonly item_id: CardItemProps['item_id'];
  private readonly card_id: CardItemProps['card_id'];
  private readonly type: CardItemProps['type'];
  private readonly x: CardItemProps['x'];
  private readonly y: CardItemProps['y'];
  private readonly width: CardItemProps['width'];
  private readonly height: CardItemProps['height'];
  private readonly rotation: CardItemProps['rotation'];
  private readonly scale_x: CardItemProps['scale_x'];
  private readonly scale_y: CardItemProps['scale_y'];
  private readonly opacity: CardItemProps['opacity'];
  private readonly z_index: CardItemProps['z_index'];
  private readonly is_locked: CardItemProps['is_locked'];
  private readonly is_visible: CardItemProps['is_visible'];
  private readonly name: CardItemProps['name'];
  private readonly option: CardItemProps['option'];
  private readonly created_at: Exclude<CardItemProps['created_at'], undefined>;
  private readonly updated_at: Exclude<CardItemProps['updated_at'], undefined>;
  private readonly deleted_at: CardItemProps['deleted_at'];

  constructor({
    item_id,
    card_id,
    type,
    x,
    y,
    width,
    height = undefined,
    rotation,
    scale_x,
    scale_y,
    opacity = undefined,
    z_index = undefined,
    is_locked = undefined,
    is_visible = undefined,
    name = undefined,
    option,
    created_at = new Date(),
    updated_at = new Date(),
    deleted_at,
  }: CardItemProps) {
    this.item_id = itemIdVo(item_id);
    this.card_id = cardIdVo(card_id);
    this.type = cardItemTypeVo(type);
    this.x = cardItemPositionVo('x', x);
    this.y = cardItemPositionVo('y', y);
    this.width = cardItemSizeVo('width', width);
    this.height = height || height === 0 ? cardItemSizeVo('height', height) : undefined;
    this.rotation = cardItemRotationVo(rotation);
    this.scale_x = cardItemScaleVo('scale_x', scale_x);
    this.scale_y = cardItemScaleVo('scale_y', scale_y);
    this.opacity = opacity || opacity === 0 ? cardItemOpacityVo(opacity) : undefined;
    this.z_index = z_index || z_index === 0 ? cardItemZindexVo(z_index) : undefined;
    this.is_locked =
      is_locked !== undefined ? cardItemIsLockedVo(is_locked) : undefined;
    this.is_visible =
      is_visible !== undefined ? cardItemIsVisibleVo(is_visible) : undefined;
    this.name = name ? cardItemNameVo(name) : undefined;
    this.option = cardItemOptionVo(option);
    this.created_at =
      created_at && created_at instanceof Date ? created_at : new Date();
    this.updated_at =
      updated_at && updated_at instanceof Date ? updated_at : new Date();
    this.deleted_at =
      deleted_at && deleted_at instanceof Date ? deleted_at : undefined;

    Object.freeze(this);
  }

  getItemId(): CardItemProps['item_id'] {
    return this.item_id;
  }
  getCardId(): CardItemProps['card_id'] {
    return this.card_id;
  }
  getType(): CardItemProps['type'] {
    return this.type;
  }
  getX(): CardItemProps['x'] {
    return this.x;
  }
  getY(): CardItemProps['y'] {
    return this.y;
  }
  getWidth(): CardItemProps['width'] {
    return this.width;
  }
  getHeight(): CardItemProps['height'] {
    return this.height;
  }
  getRotation(): CardItemProps['rotation'] {
    return this.rotation;
  }
  getScaleX(): CardItemProps['scale_x'] {
    return this.scale_x;
  }
  getScaleY(): CardItemProps['scale_y'] {
    return this.scale_y;
  }
  getOpacity(): CardItemProps['opacity'] {
    return this.opacity;
  }
  getZindex(): CardItemProps['z_index'] {
    return this.z_index;
  }
  getIsLocked(): CardItemProps['is_locked'] {
    return this.is_locked;
  }
  getIsVisible(): CardItemProps['is_visible'] {
    return this.is_visible;
  }
  getName(): CardItemProps['name'] {
    return this.name;
  }
  getOption(): CardItemProps['option'] {
    return this.option;
  }
  getCreatedAt(): Exclude<CardItemProps['created_at'], undefined> {
    return this.created_at;
  }
  getUpdatedAt(): Exclude<CardItemProps['updated_at'], undefined> {
    return this.updated_at;
  }
  getDeltedAt(): CardItemProps['deleted_at'] {
    return this.deleted_at;
  }

  getData():
    | Required<Omit<CardItemProps, 'deleted_at'>>
    | Record<'deleted_at', CardItemProps['deleted_at']> {
    return {
      item_id: this.item_id,
      card_id: this.card_id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      scale_x: this.scale_x,
      scale_y: this.scale_y,
      opacity: this.opacity,
      z_index: this.z_index,
      is_locked: this.is_locked,
      is_visible: this.is_visible,
      name: this.name,
      option: this.option,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }
}
