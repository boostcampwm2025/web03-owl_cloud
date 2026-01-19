import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

// dto를 entity로 매핑해주는 class
@Injectable()
export class DtoMappingEntity {
  constructor() {}

  public mapping(dto: any): any | never {
    throw new NullInterfaceError();
  }
}
