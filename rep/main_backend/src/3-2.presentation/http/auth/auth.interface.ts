import { CompareHash, IdGenerator } from '@domain/shared';
import { MakeHashPort } from '@app/ports/share';
import { Injectable } from '@nestjs/common';
import { v7 as uuidV7 } from 'uuid';
import * as argon from 'argon2';

// 이메일 열로 사용할 예정
export const USERS_EMAIL_ATTR = Symbol('USERS_EMAIL_ATTR');

// 네임스페이스 의존성 주입에 사용할 예정 - session jwt
export const JWT_SESSION_NAMESPACE_ATTR = Symbol('JWT_SESSION_NAMESPACE_ATTR');

// refresh_token_hash에 의존성 주입에 사용할 예정
export const REFRESH_TOKEN_HASH_KEY_NAME_ATTR = Symbol('REFRESH_TOKEN_HASH_KEY_NAME_ATTR');

// user_id를 만들때 사용하는 interface
@Injectable()
export class UserIdGenerator implements IdGenerator {
  constructor() {}

  generate(): string {
    const user_id: string = uuidV7();
    return user_id;
  }
}

// hash를 생성할때 사용하는 interface
@Injectable()
export class MakeArgonHash extends MakeHashPort {
  constructor() {
    super();
  }

  public async makeHash(value: string): Promise<string> {
    const hash: string = await argon.hash(value);
    return hash;
  }
}

// hash를 비교할때 사용하는 interface
@Injectable()
export class CompareArgonHash implements CompareHash {
  constructor() {}

  async compare({ value, hash }: { value: string; hash: string }): Promise<boolean> {
    const compareChecked: boolean = await argon.verify(hash, value);

    return compareChecked;
  }
}
