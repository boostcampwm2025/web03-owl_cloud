import { InsertToolInfoData, OpenToolDto } from '@app/room/commands/dto';
import { MakeToken } from '@app/ports/share';
import { CompareHash } from '@domain/shared';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';
import { NotValiedTickeKey } from '@error/presentation/signalling/signalling.error';
import { importJWK, JWK, SignJWT } from 'jose';
import { randomUUID } from 'crypto';

@Injectable()
export class CompareRoomArgonHash implements CompareHash {
  constructor() {}

  async compare({ value, hash }: { value: string; hash: string }): Promise<boolean> {
    const compareChecked: boolean = await argon.verify(hash, value);

    return compareChecked;
  }
}

@Injectable()
export class MakeIssueToolTicket extends MakeToken {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async make(payload: OpenToolDto): Promise<string> {
    const privateJwkRaw: string | undefined = this.config.get<string>(
      'NODE_APP_TICKET_PRIVATE_JWK',
    );
    if (!privateJwkRaw) throw new NotValiedTickeKey();

    const privateJwk = JSON.parse(privateJwkRaw) as JWK;

    const privateKey = await importJWK(privateJwk, 'RS256');

    const iss = this.config.get<string>('NODE_APP_TICKET_ISS', 'main_backend');
    const aud = this.config.get<string>('NODE_APP_TICKET_AUD', 'tool_backend');

    // 5분에 유효기간
    const ttlSec = 60 * 5;
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({
      room_id: payload.room_id,
      tool: payload.tool,
      socket_id: payload.socket_id,
      scope: ['tool:open'],
    })
      .setProtectedHeader({
        alg: 'RS256',
        typ: 'JWT',
        kid: privateJwk.kid,
      })
      .setIssuer(iss)
      .setAudience(aud)
      .setSubject(payload.user_id) // token의 주체이다.
      .setJti(randomUUID()) // 확인한적이 있는지 없는지 확인
      .setIssuedAt(now)
      .setExpirationTime(now + ttlSec)
      .sign(privateKey);

    return token;
  }
}
