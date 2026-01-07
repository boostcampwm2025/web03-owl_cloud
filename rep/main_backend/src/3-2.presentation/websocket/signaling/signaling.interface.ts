import { CompareHash } from "@domain/shared";
import { Injectable } from "@nestjs/common";
import * as argon from "argon2";


@Injectable()
export class CompareRoomArgonHash implements CompareHash {
  constructor() {}

  async compare({
    value,
    hash,
  }: {
    value: string;
    hash: string;
  }): Promise<boolean> {
    const compareChecked: boolean = await argon.verify(hash, value);

    return compareChecked;
  }
}