import { SignalingWebsocket } from '@infra/websocket/signaling/signaling.service';
import { SIGNALING_WEBSOCKET } from '@infra/websocket/websocket.constants';
import { EVENT_STREAM_NAME, ToolEnterEvent } from '@infra/event-stream/event-stream.constants';
import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME } from '@present/websocket/websocket.constants';
import { ToolConsumerService } from './tool.service';

type InformPayload = {
  tool: 'codeeditor' | 'whiteboard';
  request_user: string;
};

@Controller()
export class ToolConsumerController {
  private readonly logger = new Logger(ToolConsumerController.name);

  constructor(
    @Inject(SIGNALING_WEBSOCKET) private readonly server: SignalingWebsocket,
    private readonly toolConsumerService: ToolConsumerService,
  ) {}

  // whiteboard 입장 이벤트 consumer
  @EventPattern(EVENT_STREAM_NAME.WHITEBOARD_ENTER)
  async onWhiteboardEnter(@Payload() message: any, @Ctx() context: KafkaContext) {
    const value = message as ToolEnterEvent; //
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
      // redis 확인 main으로 보낸것이 맞는지 그리고 처음인지
      await this.toolConsumerService.checkTicketService(value);

      // 전체를 broad casting 한다.
      const socket_id: string = value.socket_id;
      const payload: InformPayload = {
        request_user: value.user_id,
        tool: value.tool,
      };
      this.server.broadcastToolRequest(
        value.room_id,
        WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.REQUEST_WHITEBOARD,
        payload,
        socket_id,
      );
    } catch (err) {
      this.logger.error(err);
      this.server.emitToSocket(value.socket_id, WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.ERROR, {
        message: err.message,
      });
      return;
    }
  }

  // codeeditor 입장 이벤트 consumer
  @EventPattern(EVENT_STREAM_NAME.CODEEDITOR_ENTER)
  async onCodeeditorEnter(@Payload() message: any, @Ctx() context: KafkaContext) {
    const value = message as ToolEnterEvent;
    const topic = context.getTopic();

    if (!value?.room_id || !value?.user_id) {
      this.logger.warn(`[${topic}] invalid payload`);
      return;
    }

    this.logger.log(
      `[${topic}] room=${value.room_id} user=${value.user_id} socket=${value.socket_id}`,
    );

    try {
      // redis 확인 main으로 보낸것이 맞는지 그리고 처음인지
      await this.toolConsumerService.checkTicketService(value);

      // 전체를 broad casting 한다.
      const socket_id: string = value.socket_id;
      const payload: InformPayload = {
        request_user: value.user_id,
        tool: value.tool,
      };
      this.server.broadcastToolRequest(
        value.room_id,
        WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.REQUEST_CODEEDITOR,
        payload,
        socket_id,
      );
    } catch (err) {
      this.logger.error(err);
      this.server.emitToSocket(value.socket_id, WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.ERROR, {
        message: err.message,
      });
      return;
    }
  }
}
