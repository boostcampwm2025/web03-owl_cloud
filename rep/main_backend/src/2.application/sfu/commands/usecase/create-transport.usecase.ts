import { Injectable, Logger } from '@nestjs/common';
import type { Router } from 'mediasoup/types';
import { SfuErrorMessage } from '@error/application/sfu/sfu.error';
import type {
  RoomRouterRepositoryPort,
  TransportRepositoryPort,
  TransportFactoryPort,
} from '../../ports';
import { CreateTransportDto, CreateRoomTransportDto, RoomEntry, TransportEntry } from '../dto';
import { DeleteDataToCache, InsertDataToCache } from '@app/ports/cache/cache.outbound';

@Injectable()
export class CreateTransportUsecase<T> {
  private readonly logger = new Logger(CreateTransportUsecase.name);

  constructor(
    private readonly roomRepo: RoomRouterRepositoryPort,
    private readonly transportRepo: TransportRepositoryPort,
    private readonly transportFactory: TransportFactoryPort,
    private readonly insertTranportInfoToRedis: InsertDataToCache<T>,
    private readonly deleteTransportInfoToRedis: DeleteDataToCache<T>,
  ) {}

  async execute(dto: CreateTransportDto): Promise<TransportEntry> {
    // 1. roomEntry 찾기
    const roomEntry: RoomEntry | undefined = this.roomRepo.get(dto.room_id);
    if (!roomEntry || roomEntry.router.closed) {
      throw new SfuErrorMessage('room_id를 다시 확인해주세요');
    }
    const router: Router = roomEntry.router;

    // transport 설정
    let transport: any; // WebRtcTransport
    try {
      // 2. transport 생성
      transport = await this.transportFactory.createWebRtcTransport(router);

      // transport 로깅 및 transport_id 설정
      this.transportFactory.attachDebugHooks(dto.room_id, transport);
      const transportId = transport.id;

      // transport 없어졌을때 이벤트 생성
      transport.observer.on('close', () => {
        this.transportRepo.delete(transportId);

        // router 갱신
        this.roomRepo.patch(dto.room_id, (e) => e.transport_ids.delete(transportId));

        // cache에 삭제 - transport_id를 전달하고 namespace를 잘 정리해야 한다.
        this.deleteTransportInfoToRedis.deleteKey({
          namespace: transportId,
          keyName: `${dto.user_id}:${dto.type}`,
        });
      });

      // 3. 메모리 저장
      this.transportRepo.set(transportId, transport);

      // 4. router 갱신
      this.roomRepo.patch(dto.room_id, (e) => e.transport_ids.add(transportId));

      // 5. cache에 transport info 정보 저장
      const validate: CreateRoomTransportDto = { ...dto, transport_id: transportId };
      const inserted: boolean = await this.insertTranportInfoToRedis.insert(validate);
      if (!inserted)
        throw new SfuErrorMessage('cache 데이터에 transport정보가 저장되지 않았습니다.');

      return {
        transportId,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
    } catch (err) {
      this.logger.error(err);
      if (transport && !transport.closed) transport.close();
      throw err;
    }
  }
}
