import { Injectable } from '@nestjs/common';
import { CreateConsumerDto, CreateConsumerResult, InsertConsumerDataDto } from '../dto';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { RoomTransportInfo } from '../../queries/dto';
import { SfuError, SfuErrorMessage } from '@error/application/sfu/sfu.error';
import type {
  ConsumerRepositoryPort,
  RoomRouterRepositoryPort,
  TransportRepositoryPort,
} from '../../ports';
import { Consumer } from 'mediasoup/types';
import { DeleteDataToCache, InsertDataToCache } from '@app/ports/cache/cache.outbound';

type CreateConsumerUsecaseProps<T> = {
  selectTransportDataFromCache: SelectDataFromCache<T>; // 나의 tranport_id가 맞는지 부터 확인
  insertConsumerDataToCache: InsertDataToCache<T>; // consumer_id에 대해서 데이터 정보를 저장
  deleteConsumerDataToCache: DeleteDataToCache<T>; // 에러가 발생하거나 consumer가 내려갔을때 삭제
};

@Injectable()
export class CreateConsumerUsecase<T> {
  private readonly selectTransportDataFromCache: CreateConsumerUsecaseProps<T>['selectTransportDataFromCache'];
  private readonly insertConsumerDataToCache: CreateConsumerUsecaseProps<T>['insertConsumerDataToCache'];
  private readonly deleteConsumerDataToCache: CreateConsumerUsecaseProps<T>['deleteConsumerDataToCache'];

  constructor(
    private readonly routerRepo: RoomRouterRepositoryPort,
    private readonly transportRepo: TransportRepositoryPort,
    private readonly consumerRepo: ConsumerRepositoryPort, // consumer가 있음
    {
      selectTransportDataFromCache,
      insertConsumerDataToCache,
      deleteConsumerDataToCache,
    }: CreateConsumerUsecaseProps<T>,
  ) {
    this.selectTransportDataFromCache = selectTransportDataFromCache;
    this.insertConsumerDataToCache = insertConsumerDataToCache;
    this.deleteConsumerDataToCache = deleteConsumerDataToCache;
  }

  async execute(dto: CreateConsumerDto): Promise<CreateConsumerResult> {
    // 1. 나의 transport_id가 맞는지 부터 확인
    // -> ( user_id, socket_id, room_id, type은 recv가 맞는지 확인 ) -> transport id만 저장하기
    const transportInfo: RoomTransportInfo = await this.selectTransportDataFromCache.select({
      namespace: dto.transport_id,
      keyName: '',
    });
    if (
      dto.room_id !== transportInfo.room_id ||
      dto.socket_id !== transportInfo.socket_id ||
      transportInfo.type !== 'recv' ||
      dto.user_id !== transportInfo.user_id
    )
      throw new SfuErrorMessage(
        'consumer를 위한 transport_id가 올바르지 않습니다 다시 확인해주시길 바랍니다.',
      );

    // 2. consumer로 소비가 가능한지 확인해야 한다. ( router에 producer가 있긴한지? 그리고 설정등이 적합한지 확인 )
    const entry = this.routerRepo.get(dto.room_id);
    if (!entry) throw new SfuErrorMessage('room_id에 해당하는 router를 찾을 수 없습니다.');
    const canConsume = entry.router.canConsume({
      producerId: dto.producer_id,
      rtpCapabilities: dto.rtpCapabilities,
    });
    if (!canConsume) throw new SfuErrorMessage('이 producer에 대해서 consume을 만들수 없습니다.');

    // transport 찾기
    const transport = this.transportRepo.get(dto.transport_id);
    if (!transport)
      throw new SfuErrorMessage(
        'consumer를 위한 transport_id가 올바르지 않습니다 다시 확인해주시길 바랍니다.',
      );

    let consumer: Consumer | undefined;
    try {
      // 3. consumer를 생성
      consumer = await transport.consume({
        producerId: dto.producer_id,
        rtpCapabilities: dto.rtpCapabilities,
        paused: true, // 준비 되면 다시 온한다.
      }); // 이 consumer들은 관리하며 유저가 받거나 닫거나 할 수 있게 할 예정

      // consumer 닫혔을때 처리
      const consumer_id: string = consumer.id;
      consumer.observer.on('close', () => {
        // 메모리에서 삭제
        if (this.consumerRepo.get(consumer_id)) this.consumerRepo.delete(consumer_id);

        // cache에서 삭제
        void this.deleteConsumerDataToCache
          .deleteKey({ namespace: `${dto.room_id}:${dto.user_id}`, keyName: consumer_id })
          .catch(() => {});
      });

      // 해당 consume transport가 닫힌다면
      consumer.on('transportclose', () => {
        consumer?.close();
      });

      // 해당 producer가 닫힌다면
      consumer.on('producerclose', () => {
        consumer?.close();
      });

      // 4. conusmer를 메모리에 저장
      this.consumerRepo.set(consumer_id, consumer);

      // 5. consumer 정보를 저장할 cache가 있긴 해야 한다 ( 이 consumer가 내것이 맞는지를 확인해야 하는 용도 )
      const consumerData: InsertConsumerDataDto = {
        transport_id: dto.transport_id,
        room_id: dto.room_id,
        consumer_id,
        producer_id: dto.producer_id,
        user_id: dto.user_id,
        status: dto.status,
      };
      const inserted: boolean = await this.insertConsumerDataToCache.insert(consumerData);
      if (!inserted) {
        consumer.close();
        throw new SfuErrorMessage('consumer 데이터를 저장하는데 에러가 발생했습니다.');
      }

      // 값 반환
      return {
        producer_id: dto.producer_id,
        consumer_id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      };
    } catch (err) {
      consumer?.close();
      throw new SfuError(err);
    }
  }
}
