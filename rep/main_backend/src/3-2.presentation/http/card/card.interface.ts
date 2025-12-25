import { IdGenerator, PathMapping } from "@domain/shared";
import { Injectable } from "@nestjs/common";
import path from "path";
import { v7 as uuidV7 } from "uuid";


// redis에서 사용하는 card_item_asset 네임스페이스 심볼화
export const CARD_ITEM_ASSET_NAMESPACE = Symbol("CARD_ITEM_ASSET_NAMESPACE");
// redis에서 사용하는 card_id key_name에 대한 심볼화
export const CARD_ITEM_ID_KEY_NAME = Symbol("CARD_ITEM_ID_KEY_NAME");
// redis에서 사용하는 card_item_attribte에 대한 심볼화
export const CARD_ITEM_ID_ATTRIBUTE_NAME = Symbol("CARD_ITEM_ID_ATTRIBUTE_NAME");

@Injectable()
export class CardIdGenerator implements IdGenerator {
  constructor() {}

  generate(): string {
    const user_id: string = uuidV7();
    return user_id;
  };
};

@Injectable()
export class CardItemPathMapping implements PathMapping {
  constructor() {}

  mapping(pathList: Array<string>): string {
    return path.posix.join(...pathList);
  }
};