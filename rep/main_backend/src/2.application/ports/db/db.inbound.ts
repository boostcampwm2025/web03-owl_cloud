// db에서 찾는걸 위주로 할때 사용되는 ports

import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

class InboundBaseDb<T> {
  protected readonly db: T;

  constructor(db: T) {
    this.db = db;
  }
}

@Injectable()
export class SelectDataFromDb<T> extends InboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  /** attributeName은 열의 이름이고 attributeValue은 그열에 해당하는 값을 찾는다. */
  public async select({
    attributeName,
    attributeValue,
  }: {
    attributeName: string;
    attributeValue: any;
  }): Promise<any | undefined> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class SelectDatasFromDb<T> extends InboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  public async selects(
    attributes: Array<{
      attributeName: string;
      attributeValue: any;
    }>,
  ): Promise<Array<any> | undefined> | never {
    throw new NullInterfaceError();
  }
}
