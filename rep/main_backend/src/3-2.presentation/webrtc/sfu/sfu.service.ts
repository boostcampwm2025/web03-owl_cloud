import { Injectable } from '@nestjs/common';
import {
  CreateConsumerDto,
  CreateConsumerResult,
  CreateConsumerResults,
  CreateConsumersDto,
  CreateProduceResult,
  CreatePropduceDto,
  CreateTransportDto,
  RoomEntry,
  StopScreenProducerDto,
  StopScreenProducerResult,
  TransportEntry,
} from '@app/sfu/commands/dto';
import {
  CreateConsumersUsecase,
  CreateConsumerUsecase,
  CreateProduceUsecase,
  CreateRouterUsecase,
  CreateTransportUsecase,
  DisconnectUserUsecase,
  StopScreenProducerUsecase,
} from '@app/sfu/commands/usecase';
import { RoomRouterRepository, TransportRepository } from '@infra/memory/sfu';
import {
  ConnectTransportUsecase,
  PauseConsumerUsecase,
  PauseConsumesUsecase,
  PauseProducerUsecase,
  ResumeConsumersUsecase,
  ResumeConsumerUsecase,
  resumeProducerUsecase,
} from '@app/sfu/queries/usecase';
import {
  ConnectTransportType,
  PauseConsumerDto,
  PauseConsumesDto,
  PauseProducerDto,
  ResumeConsumerDto,
  ResumeConsumersDto,
  ResumeProducerDto,
} from '@app/sfu/queries/dto';

@Injectable()
export class SfuService {
  constructor(
    // usecase
    private readonly createRouterUsecase: CreateRouterUsecase,
    private readonly createTransportUsecase: CreateTransportUsecase<any>,
    private readonly connectTransportUsecase: ConnectTransportUsecase<any>,
    private readonly disconnectUsertUsecase: DisconnectUserUsecase<any>,
    private readonly createProducerUsecase: CreateProduceUsecase<any>,
    private readonly createConsumerUsecase: CreateConsumerUsecase<any>,
    private readonly resumeConsumerUsecase: ResumeConsumerUsecase<any>,
    private readonly pauseConsumerUsecase: PauseConsumerUsecase<any>,
    private readonly createConsumersUsecase: CreateConsumersUsecase<any>,
    private readonly resumeConsumersUsecase: ResumeConsumersUsecase<any>,
    private readonly pauseConsumersUsecase: PauseConsumesUsecase<any>,
    private readonly resumeProducerUsecase: resumeProducerUsecase<any>, // producer를 다시 재활성화 하기 위한 usecase
    private readonly pauseProducerUsecase: PauseProducerUsecase<any>, // producer를 멈추기 위한 usecase
    private readonly stopScreenUsecase: StopScreenProducerUsecase<any>, // screen을 멈추기 위한 usecase
    // infra
    private readonly roomRouters: RoomRouterRepository,
    private readonly transports: TransportRepository,
  ) {}

  // 1. router 생성 관련 함수 -> 생성 혹은 얻는 이유는 방을 만들었다고 무조건 router를 부여하면 비어있는 방에 낭비가 심할 수 있기에 들어와야 활성화가 된다.
  async getOrCreateRoomRouter(room_id: string): Promise<RoomEntry> {
    return this.createRouterUsecase.execute(room_id);
  }

  // 방이 닫혔을때 로직도 구현해두자
  closeRoomRouter(room_id: string): void {
    const entry = this.roomRouters.get(room_id);
    if (!entry) return;

    // transport를 관리
    for (const transport_id of entry.transport_ids) {
      const t = this.transports.get(transport_id);
      if (t && !t.closed) {
        try {
          t.close();
        } catch {}
      }
      this.transports.delete(transport_id);
    }

    // 이 부분을 한번 봐바야 겠다. 여기서 마지막 유저가 나갔다면 모를까
    try {
      if (!entry.router.closed) entry.router.close();
    } finally {
      this.roomRouters.delete(room_id); // 근데 생각해보면 close를 해두어서 삭제되기는 할거다.
    }
  }

  // 유저가 나갈때 로직을 구현한다.
  async disconnectUser(user_id: string): Promise<void> {
    await this.disconnectUsertUsecase.execute(user_id);
  }

  // 2. transport 부분 생성 ( 나중에 전체적인 부분 usecase로 빼자고 )
  async createTransPort(dto: CreateTransportDto): Promise<TransportEntry> {
    return this.createTransportUsecase.execute(dto);
  }

  // 3. transport connect 연결 ( 이때 부터는 이제 sfu와 webrtc 통신이 가능해졌다고 생각하면 된다. )
  async connectTransport(dto: ConnectTransportType): Promise<void> {
    await this.connectTransportUsecase.execute(dto);
  }

  // 4. produce 생성
  async createProducer(dto: CreatePropduceDto): Promise<CreateProduceResult> {
    return this.createProducerUsecase.execute(dto);
  }

  // 5. consumer 생성
  async createConsumer(dto: CreateConsumerDto): Promise<CreateConsumerResult> {
    return this.createConsumerUsecase.execute(dto);
  }

  // 6. consumer 재개
  async resumeConsumer(dto: ResumeConsumerDto): Promise<void> {
    await this.resumeConsumerUsecase.execute(dto);
  }

  // 7. consumer 멈춤
  async pauseConsumer(dto: PauseConsumerDto): Promise<void> {
    await this.pauseConsumerUsecase.execute(dto);
  }

  // 8. 여러개의 consumer를 만듬
  async createConsumers(dto: CreateConsumersDto): Promise<CreateConsumerResults> {
    return this.createConsumersUsecase.execute(dto);
  }

  // 9. consumer를 재개함
  async resumeConsumers(dto: ResumeConsumersDto): Promise<void> {
    await this.resumeConsumersUsecase.execute(dto);
  }

  // 10. resumer를 멈춤
  async pauseConsumers(dto: PauseConsumesDto): Promise<void> {
    await this.pauseConsumersUsecase.execute(dto);
  }

  // 11. producer on
  async resumeProducers(dto: ResumeProducerDto): Promise<void> {
    await this.resumeProducerUsecase.execute(dto);
  }

  // 12. producer off
  async pauseProducers(dto: PauseProducerDto): Promise<void> {
    await this.pauseProducerUsecase.execute(dto);
  }

  // 13. 스크린 producer off
  async stopScreen(dto: StopScreenProducerDto): Promise<StopScreenProducerResult> {
    return this.stopScreenUsecase.execute(dto);
  }
}
