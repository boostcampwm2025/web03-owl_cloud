import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

class OutboundBaseDb<T> {
  protected db: T;

  constructor(db: T) {
    this.db = db;
  }
}

@Injectable()
export class InsertValueToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  public async insert(entity: any): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class DeleteValueToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  public async delete({
    uniqueValue,
    addOption = undefined,
  }: {
    uniqueValue: any;
    addOption: any | undefined;
  }): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class UpdateValueToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  public async update({
    uniqueValue,
    updateColName,
    updateValue,
  }: {
    uniqueValue: any;
    updateColName: string;
    updateValue: any;
  }): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

// 여러개의 값을 수정하고 싶을때 사용하는 port라고 할 수 있다.
@Injectable()
export class UpdateValuesToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  public async updates(entities: Array<any>): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

// 여러개의 값을 삭제하고 싶을때 사용하는 port
@Injectable()
export class DeleteValuesToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  public async deletes(
    keys: Array<{ uniqueValue: any; addOption: any | undefined }>,
  ): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}
