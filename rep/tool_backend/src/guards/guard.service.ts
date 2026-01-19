import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { importJWK, JWK, jwtVerify } from 'jose';

@Injectable()
export class GuardService {
  constructor(private readonly config: ConfigService) {}

  async verify(token: string) {
    // jwk 공개키 가져오기
    const publicJwkRaw = this.config.get<string>('NODE_APP_TICKET_PUBLIC_JWK');
    if (!publicJwkRaw) throw new Error('NO_PUBLIC_JWK');

    const publicJwk = JSON.parse(publicJwkRaw) as any;

    const jwk = (publicJwk?.kty ? publicJwk : publicJwk?.keys?.[0]) as JWK;
    if (!jwk) throw new Error('INVALID_JWK_FORMAT');
    const publicKey = await importJWK(publicJwk, 'RS256');

    const iss = this.config.get<string>('NODE_APP_TICKET_ISS', 'main_backend');
    const aud = this.config.get<string>('NODE_APP_TICKET_AUD', 'tool_backend');

    const { payload } = await jwtVerify(token, publicKey, { issuer: iss, audience: aud });

    const sub = payload.sub;
    const room_id = payload['room_id'];
    const tool = payload['tool'] as 'whiteboard' | 'codeeditor';
    const socket_id = payload['socket_id'];
    const ticket = token;
    const scope = payload['scope'];

    if (typeof sub !== 'string') throw new Error('sub가 없습니다. (user_id)');
    if (typeof room_id !== 'string') throw new Error('room_id가 없습니다.');
    if (typeof socket_id !== 'string') throw new Error('socket_id가 없습니다.');
    if (typeof tool !== 'string') throw new Error('tool이 없습니다.');
    if (typeof ticket !== 'string') throw new Error('ticket이 없습니다.');
    if (scope && !Array.isArray(scope)) throw new Error('scope가 없습니다.');

    const allowedTools = new Set(['whiteboard', 'codeeditor']);
    if (!allowedTools.has(tool)) throw new Error('허용되지 않은 tool 입니다.');

    return { sub, room_id, tool, socket_id, ticket, scope: scope as string[] | undefined };
  }
}
