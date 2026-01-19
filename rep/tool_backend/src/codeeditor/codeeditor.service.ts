import { GuardService } from '@/guards/guard.service';
import { ToolBackendPayload } from '@/guards/guard.type';
import { Injectable } from '@nestjs/common';
import { CODEEDITOR_GROUP } from './codeeditor.constants';

@Injectable()
export class CodeeditorService {
  constructor(private readonly guard: GuardService) {}

  async guardService(token: string, type: 'main' | 'sub'): Promise<ToolBackendPayload> {
    const verified = await this.guard.verify(token);

    const payload: ToolBackendPayload = {
      room_id: verified.room_id,
      user_id: verified.sub,
      tool: verified.tool,
      socket_id: verified.socket_id,
      ticket: verified.ticket,
      clientType: type,
    };

    if (payload.tool !== 'codeeditor') throw new Error('codeeditor만 가능한 gateway입니다.');

    return payload;
  }

  // 이 함수로 가입을하고 여기로 브로드캐스팅을 진행합니다.
  makeNamespace(room_id: string): string {
    return `${CODEEDITOR_GROUP.CODEEDITOR}:${room_id}`;
  }
}
