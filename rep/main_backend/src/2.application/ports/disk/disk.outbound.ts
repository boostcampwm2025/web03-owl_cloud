import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

class OutboundBaseDisk<T> {
  protected disk: T;

  constructor(disk: T) {
    this.disk = disk;
  }
}

@Injectable()
export class CompleteUploadFileToDisk<T> extends OutboundBaseDisk<T> {
  constructor(disk: T) {
    super(disk);
  }

  async complete({
    pathName,
    upload_id,
    size,
  }: {
    pathName: string;
    upload_id: string;
    size: number;
  }): Promise<void> | never {
    throw new NullInterfaceError();
  }
}
