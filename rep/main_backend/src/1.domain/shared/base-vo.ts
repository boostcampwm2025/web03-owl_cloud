import {
  NotEmptyError,
  NotAllowType,
  NotAllowMinValue,
  NotTypeUUidV7,
} from '@error/domain/user/user.error';

// 기본적인 vo
export function baseVo({
  name,
  value,
  type,
}: {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean';
}): void | never {
  // null
  if (!value || value === '' || value === undefined) throw new NotEmptyError(name);

  // type 확인
  if (typeof value !== type) throw new NotAllowType({ name, type });
}

// id 즉 숫자와 관련되었음
export function idVo(id: number) {
  const name: string = 'id';

  if (id !== 0) baseVo({ name, value: id, type: 'number' });

  const min: number = 0;
  if (id < min) throw new NotAllowMinValue({ name, min });

  return id;
}

// uuid랑 관련있음
export function uuidv7Vo({ uuid, name }: { uuid: string; name: string }): string {
  baseVo({ name, value: uuid, type: 'string' });

  const uuidV7Regxp: RegExp =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV7Regxp.test(uuid)) throw new NotTypeUUidV7(name);

  return uuid.trim();
}
