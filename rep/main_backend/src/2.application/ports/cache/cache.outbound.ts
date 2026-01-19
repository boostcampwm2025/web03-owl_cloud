import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

class OutboundBaseCache<T> {
  protected cache: T;

  constructor(cache: T) {
    this.cache = cache;
  }
}

// cache에 데이터를 입력할때 쓰이는 class
@Injectable()
export class InsertDataToCache<T> extends OutboundBaseCache<T> {
  constructor(cahce: T) {
    super(cahce);
  }

  public async insert(entity: any): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

// cache에 데이터를 삭제할때 쓰이는 class
@Injectable()
export class DeleteDataToCache<T> extends OutboundBaseCache<T> {
  constructor(cache: T) {
    super(cache);
  }

  public async deleteNamespace(namespace: string): Promise<boolean> | never {
    throw new NullInterfaceError();
  }

  public async deleteKey({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class UpdateDataToCache<T> extends OutboundBaseCache<T> {
  constructor(cache: T) {
    super(cache);
  }

  public async updateKey({
    namespace,
    keyName,
    updateValue,
  }: {
    namespace: string;
    keyName: string;
    updateValue: any;
  }): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

// 여러개를 삭제하고 싶을때 사용하는 pory
@Injectable()
export class DeleteDatasToCache<T> extends OutboundBaseCache<T> {
  constructor(cache: T) {
    super(cache);
  }

  public async deleteNamespaces(namespaces: Array<string>): Promise<boolean> | never {
    throw new NullInterfaceError();
  }

  public async deleteKeyNames(
    namespace: string,
    keyNames: Array<string>,
  ): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}
