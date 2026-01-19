import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

class InboundBaseCache<T> {
  protected cache: T;

  constructor(cache: T) {
    this.cache = cache;
  }
}

@Injectable()
export class SelectDataFromCache<T> extends InboundBaseCache<T> {
  constructor(cache: T) {
    super(cache);
  }

  public async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<any | undefined> | never {
    throw new NullInterfaceError();
  }
}

// 여러개의 값을 뽑아야 할때 사용
@Injectable()
export class SelectDatasFromCache<T> extends InboundBaseCache<T> {
  constructor(cache: T) {
    super(cache);
  }

  public async selects({
    namespaces,
  }: {
    namespaces: Array<string>;
  }): Promise<Array<any> | any | undefined> | never {
    throw new NullInterfaceError();
  }

  public async selectKeys({
    namespace,
    keyNames,
  }: {
    namespace: string;
    keyNames: Array<string>;
  }): Promise<Array<any> | any | undefined> | never {
    throw new NullInterfaceError();
  }
}
