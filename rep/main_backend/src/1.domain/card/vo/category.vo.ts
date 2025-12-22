import { NotAllowMaxLengthText } from '@error/domain/user/user.error';
import { baseVo } from '@domain/shared';

export type CategoryProps = {
  id: number;
  name: string;
  created_at?: Date;
  updated_at?: Date;
};

export function categoryNameVo(name: CategoryProps['name']): string {
  const title: string = 'name';

  baseVo({ name: title, value: name, type: 'string' });
  name = name.trim();

  const length: number = 255;
  if (name.length > length)
    throw new NotAllowMaxLengthText({ name: title, length });

  return name;
}
