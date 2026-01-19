import { NullInterfaceError } from '@/0.common/error/application/application.error';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MakeToken {
  constructor() {}

  async make(payload: any): Promise<string> | never {
    throw new NullInterfaceError();
  }
}
