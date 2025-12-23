import { NullInterfaceError } from "@/0.common/error/application/application.error";
import { Injectable } from "@nestjs/common";


class InboundBaseDisk<T> {
  protected disk : T;

  constructor( disk : T ) {
    this.disk = disk;
  }
};

@Injectable()
export class GetUploadUrlFromDisk<T> extends InboundBaseDisk<T> {
  constructor( disk : T ) { super(disk); };

  public async getUrl( { pathName, mime_type } : { pathName : Array<string>, mime_type : string }) : Promise<string> | never {
    throw new NullInterfaceError();
  };
};

@Injectable()
export class GetMultiPartVerGroupIdFromDisk<T> extends InboundBaseDisk<T> {
  constructor( disk : T ) { super(disk); };

  public async getMultiId( { pathName, mime_type } : { pathName : Array<string>, mime_type : string } ) : Promise<string> | never {
    throw new NullInterfaceError();
  };
};

@Injectable()
export class GetMultiPartUploadUrlFromDisk<T> extends InboundBaseDisk<T> {
  constructor( disk : T ) { super(disk); };

  public async getUrls({ upload_id, pathName, partNumbers } : { upload_id : string, pathName : string, partNumbers : Array<number> }) : Promise<Array<any>> | never {
    throw new NullInterfaceError();
  }
};