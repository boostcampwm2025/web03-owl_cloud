import { IdGenerator, MakeRandomStr } from '@/1.domain/shared';
import { MakeHashPort } from '@/2.application/ports/share';
import { Injectable } from '@nestjs/common';
import { v7 as UUidv7 } from 'uuid';
import * as argon from 'argon2';

// 방에 room_id를 생성하는거
@Injectable()
export class MakeRoomIdGenerator implements IdGenerator {
  constructor() {}

  // room_id를 생성하기 위한 generator
  generate(): string {
    return UUidv7();
  }
}

// 비밀번호 해시를 만드는 클래스
@Injectable()
export class MakeArgonRoomPasswordHash extends MakeHashPort {
  constructor() {
    super();
  }

  public async makeHash(value: string): Promise<string> {
    const hash: string = await argon.hash(value);
    return hash;
  }
}

// random으로 room의 code를 생성하는 생성기
@Injectable()
export class MakeRoomRandomCodeGenerator implements MakeRandomStr {
  constructor() {}

  make(length: number): string {
    const chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes); // 랜덤으로 문자 숫자

    // 결과값 반환
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }

    return result;
  }
}
