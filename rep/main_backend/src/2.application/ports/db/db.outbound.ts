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
  };

  public async insert(entity: any): Promise<boolean> | never {
    throw new NullInterfaceError();
  };
};

@Injectable()
export class DeleteValueToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  };

  public async delete({uniqueValue, addOption = undefined} : {uniqueValue: any, addOption : any | undefined}): Promise<boolean> | never {
    throw new NullInterfaceError();
  };
};

@Injectable()
export class UpdateValueToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  };

  public async update({uniqueValue, updateValue } : {uniqueValue: any, updateValue : any }) : Promise<boolean> | never {
    throw new NullInterfaceError();
  };
};