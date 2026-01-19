import { NullInterfaceError } from '@/0.common/error/application/application.error';
import { Injectable } from '@nestjs/common';

class InboundBaseDisk<T> {
  protected disk: T;

  constructor(disk: T) {
    this.disk = disk;
  }
}

@Injectable()
export class GetUploadUrlFromDisk<T> extends InboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  public async getUrl({
    pathName,
    mime_type,
  }: {
    pathName: Array<string>;
    mime_type: string;
  }): Promise<string> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class GetUploadUrlsFromDisk<T> extends InboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  public async getUrls(
    paths: Array<{ uniqueKey: string; pathName: string; mime_type: string }>,
  ): Promise<Record<string, any>> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class GetMultiPartVerGroupIdFromDisk<T> extends InboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  public async getMultiId({
    pathName,
    mime_type,
  }: {
    pathName: Array<string>;
    mime_type: string;
  }): Promise<string> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class GetMultiPartVerCompleteGroupIdFromDisk<T> extends InboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  public async getCompleteMultiId({
    pathName,
    mime_type,
  }: {
    pathName: Array<string>;
    mime_type: string;
  }): Promise<any> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class GetMultiPartUploadUrlFromDisk<T> extends InboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  public async getUrls({
    upload_id,
    pathName,
    partNumbers,
  }: {
    upload_id: string;
    pathName: string;
    partNumbers: Array<number>;
  }): Promise<Array<any>> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class CheckUploadDataFromDisk<T> extends InboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  public async check({
    pathName,
    etag,
  }: {
    pathName: string;
    etag: string;
  }): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}

@Injectable()
export class CheckUploadDatasFromDisk<T> extends InboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  public async checks({
    pathName,
    upload_id,
    tags,
  }: {
    pathName: string;
    upload_id: string;
    tags: any;
  }): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}
