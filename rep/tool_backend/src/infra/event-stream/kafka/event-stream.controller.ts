import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { EVENT_STREAM_NAME } from '../event-stream.constants';
import { ToolLeftDto } from './event-stream.type';
import { CODEEDITOR_WEBSOCKET, WHITEBOARD_WEBSOCKET } from '@/infra/websocket/websocket.constants';
import { CodeeditorWebsocket } from '@/infra/websocket/codeeditor/codeeditor.service';
import { WhiteboardWebsocket } from '@/infra/websocket/whiteboard/whiteboard.service';
import {
  CodeeditorRepository,
  PendingRepository,
  SnapStateRepository,
  WhiteboardRepository,
} from '@/infra/memory/tool';
import { CODEEDITOR_GROUP } from '@/codeeditor/codeeditor.constants';

@Controller()
export class MainConsumerController {
  private readonly logger = new Logger(MainConsumerController.name);

  constructor(
    @Inject(CODEEDITOR_WEBSOCKET) private readonly codeeditorSocket: CodeeditorWebsocket,
    @Inject(WHITEBOARD_WEBSOCKET) private readonly whiteboardSocket: WhiteboardWebsocket,
    private readonly codeeditorRepo: CodeeditorRepository, // codeeditor용 repo
    private readonly whiteboardRepo: WhiteboardRepository, // whiteboard용 repo
    private readonly snapStateRepo: SnapStateRepository,
    private readonly pendingRepo: PendingRepository,
  ) {}

  @EventPattern(EVENT_STREAM_NAME.TOOL_LEFT)
  async toolLeft(@Payload() message: any, @Ctx() context: KafkaContext) {
    const value = message as ToolLeftDto; //
    const topic = context.getTopic();
    const partition = context.getPartition();

    // value 검증
    if (!value?.room_id || !value?.user_id) {
      this.logger.warn(`[${topic}] invalid payload`);
      return;
    }

    // topic을 적는다.
    this.logger.log(
      `[${topic}] room=${value.room_id} user=${value.user_id} socket=${value.socket_id} partition=${partition}`,
    );

    try {
      if (value.tool === 'codeeditor') {
        await this.codeeditorSocket.disconnectCodeeditorRoom(value.room_id);
        // 메모리를 비워야 한다.
        this.codeeditorRepo.delete(value.room_id);
        // snapshot을 찍을 것인가??
      } else if (value.tool === 'whiteboard') {
        await this.whiteboardSocket.disconnectWhiteboardRoom(value.room_id);

        // 마찬가지일 것이다.
        this.whiteboardRepo.delete(value.room_id);
        this.pendingRepo.delete(value.room_id);
        this.snapStateRepo.delete(value.room_id);
      }
      return;
    } catch (err) {
      this.logger.error(err);
      return;
    }
  }
}
