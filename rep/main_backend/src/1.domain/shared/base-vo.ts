import {
  NotEmptyError,
  NotAllowType,
  NotAllowMinValue,
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
  if (!value || value === '' || value === undefined)
    throw new NotEmptyError(name);

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
