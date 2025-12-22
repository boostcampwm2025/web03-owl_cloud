import {
  NotAllowCardItemType,
  NotAllowRangeType,
} from '@error/domain/card/card.error';
import {
  NotAllowMaxLengthText,
  NotAllowMinValue,
  NotAllowType,
  NotTypeUUidV7,
} from '@error/domain/user/user.error';
import { baseVo } from '@domain/shared';

export const cardItemTypes: Array<string> = ['text', 'image', 'video'] as const;
export type CardItemTypeProps = (typeof cardItemTypes)[number];

export type CardItemProps = {
  item_id: string;
  card_id: string;
  type: CardItemTypeProps;
  x: number;
  y: number;
  width: number;
  height: number | undefined;
  rotation: number;
  scale_x: number;
  scale_y: number;
  opacity: number | undefined;
  z_index: number | undefined;
  is_locked: boolean | undefined;
  is_visible: boolean | undefined;
  name: string | undefined;
  option: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | undefined;
};

// item_id 체크
export function itemIdVo(item_id: CardItemProps['item_id']): string {
  const name: string = 'item_id';

  baseVo({ name, value: item_id, type: 'string' });
  item_id = item_id.trim();

  const uuidV7Regxp: RegExp =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV7Regxp.test(item_id)) throw new NotTypeUUidV7(name);

  return item_id;
}

// card_item의 type에 대한 vo
export function cardItemTypeVo(type: CardItemProps['type']): CardItemTypeProps {
  const name: string = 'type';

  baseVo({ name, value: type, type: 'string' });
  type = type.trim().toLowerCase();

  if (!cardItemTypes.includes(type)) throw new NotAllowCardItemType();

  return type;
}

// x, y값에 대한 타입
export function cardItemPositionVo(
  name: string,
  position: CardItemProps['x'] | CardItemProps['y'],
): number {
  if (position !== 0) baseVo({ name, value: position, type: 'number' });

  return position;
}

// width, height에 대한 타입
export function cardItemSizeVo(
  name: string,
  size: CardItemProps['width'] | Exclude<CardItemProps['height'], undefined>,
): number {
  if (size !== 0) baseVo({ name, value: size, type: 'number' });

  const min: number = 0;
  if (size < min) throw new NotAllowMinValue({ name, min });

  return size;
}

// rotation에 대한 타입
export function cardItemRotationVo(
  rotation: CardItemProps['rotation'],
): number {
  const name: string = 'rotation';

  if (rotation !== 0) baseVo({ name, value: rotation, type: 'number' });

  const min: number = 0;
  if (rotation < min) throw new NotAllowMinValue({ name, min });

  return rotation;
}

// scale에 대한 타입
export function cardItemScaleVo(
  name: string,
  scale: CardItemProps['scale_x'] | CardItemProps['scale_y'],
): number {
  if (scale !== 0) baseVo({ name, value: scale, type: 'number' });

  const min: number = 0;
  if (scale < min) throw new NotAllowMinValue({ name, min });

  return scale;
}

// opacity에 대한 타입
export function cardItemOpacityVo(
  opacity: Exclude<CardItemProps['opacity'], undefined>,
): number {
  const name: string = 'opacity';

  if (opacity !== 0) baseVo({ name, value: opacity, type: 'number' });

  const min: number = 0;
  const max: number = 1;
  if (opacity < min || opacity > max)
    throw new NotAllowRangeType({ name, max, min });

  return opacity;
}

// z_index에 대한 타입
export function cardItemZindexVo(
  z_index: Exclude<CardItemProps['z_index'], undefined>,
): number {
  const name: string = 'z_index';

  if (z_index !== 0) baseVo({ name, value: z_index, type: 'number' });

  const min: number = 0;
  if (z_index < min) throw new NotAllowMinValue({ name, min });

  return z_index;
}

// is_locked에 대한 타입 체크
export function cardItemIsLockedVo(
  is_locked: Exclude<CardItemProps['is_locked'], undefined>,
): boolean {
  const name: string = 'is_locked';

  if ( is_locked !== false ) baseVo({ name, value: is_locked, type: 'boolean' });

  return is_locked;
}

// is_visible에 대한 타입 체크
export function cardItemIsVisibleVo(
  is_visible: Exclude<CardItemProps['is_visible'], undefined>,
): boolean {
  const name: string = 'is_visible';

  if ( is_visible !== false ) baseVo({ name, value: is_visible, type: 'boolean' });

  return is_visible;
}

// name에 대한 타입 체크
export function cardItemNameVo(
  name: Exclude<CardItemProps['name'], undefined>,
): string {
  const title: string = 'name';

  baseVo({ name: title, value: name, type: 'string' });
  name = name.trim();

  const length: number = 255;
  if (name.length > length)
    throw new NotAllowMaxLengthText({ name: title, length });

  return name;
}

// option에 대한 타입 체크
export function cardItemOptionVo(
  option: CardItemProps['option'],
): Record<string, any> {
  const name: string = 'option';

  if (
    !option ||
    option === null ||
    option === undefined ||
    typeof option !== 'object'
  )
    throw new NotAllowType({ name, type: 'json' });

  return option;
}
