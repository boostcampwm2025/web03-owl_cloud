import { Injectable } from '@nestjs/common';
import {
  CreateConsumerResults,
  CreateConsumersDto,
  CreateConsumersProducerInfoDto,
  InsertConsumerDatasDto,
} from '../dto';
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

type CreateConsumersUsecaseProps<T> = {
  selectTransportDataFromCache: SelectDataFromCache<T>; // 나의 tranport_id가 맞는지 부터 확인
  insertConsumerDatasToCache: InsertDataToCache<T>; // consumer_id에 대해서 데이터 정보를 저장 -> 새로 만들어야 함
  deleteConsumerDataToCache: DeleteDataToCache<T>; // 에러가 발생하거나 consumer가 내려갔을때 삭제
};

@Injectable()
export class CreateConsumersUsecase<T> {
  private readonly selectTransportDataFromCache: CreateConsumersUsecaseProps<T>['selectTransportDataFromCache'];
  private readonly insertConsumerDatasToCache: CreateConsumersUsecaseProps<T>['insertConsumerDatasToCache'];
  private readonly deleteConsumerDataToCache: CreateConsumersUsecaseProps<T>['deleteConsumerDataToCache'];

  constructor(
    private readonly routerRepo: RoomRouterRepositoryPort,
    private readonly transportRepo: TransportRepositoryPort,
    private readonly consumerRepo: ConsumerRepositoryPort, // consumer가 있음
    {
      selectTransportDataFromCache,
      insertConsumerDatasToCache,
      deleteConsumerDataToCache,
    }: CreateConsumersUsecaseProps<T>,
  ) {
    this.selectTransportDataFromCache = selectTransportDataFromCache;
    this.insertConsumerDatasToCache = insertConsumerDatasToCache;
    this.deleteConsumerDataToCache = deleteConsumerDataToCache;
  }

  async execute(dto: CreateConsumersDto): Promise<CreateConsumerResults> {
    // 1. 나의 transport_id가 맞는지 부터 확인 -> 이건 한개여도 괜찮다.
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

    // transport 찾기
    const transport = this.transportRepo.get(dto.transport_id);
    if (!transport)
      throw new SfuErrorMessage(
        'consumer를 위한 transport_id가 올바르지 않습니다 다시 확인해주시길 바랍니다.',
      );

    // 2. consumer로 소비가 가능한지 확인해야 한다. -> 여러개 라는 점을 기억해야 한다.
    const entry = this.routerRepo.get(dto.room_id);
    if (!entry) throw new SfuErrorMessage('room_id에 해당하는 router를 찾을 수 없습니다.');

    // 3) canConsume 되는 producer만 필터링
    const canConsumeProducer: Array<CreateConsumersProducerInfoDto> = [];
    for (const producerInfo of dto.producer_infos) {
      const canConsume = entry.router.canConsume({
        producerId: producerInfo.producer_id,
        rtpCapabilities: producerInfo.rtpCapabilities,
      });
      if (!canConsume) continue;
      canConsumeProducer.push(producerInfo);
    }
    if (canConsumeProducer.length === 0) return []; // 만약 하나도 없다면 바로 반환

    // 생성된 consumers
    const createdConsumers: Consumer[] = [];
    const createdConsumerIds: string[] = [];
    const results: CreateConsumerResults = [];

    const insertPayload: InsertConsumerDatasDto = {
      transport_id: dto.transport_id,
      room_id: dto.room_id,
      user_id: dto.user_id,
      consumer_info: [],
    };

    const namespace: string = `${dto.room_id}:${dto.user_id}`;
    try {
      // 4) consumer 여러 개 생성
      for (const producerInfo of canConsumeProducer) {
        // consumer 생성
        const consumer = await transport.consume({
          producerId: producerInfo.producer_id,
          rtpCapabilities: producerInfo.rtpCapabilities,
          paused: true,
        });

        const consumer_id = consumer.id;

        // observer close 처리(메모리/캐시 정리)
        consumer.observer.on('close', () => {
          // 메모리에서 삭제
          if (this.consumerRepo.get(consumer_id)) this.consumerRepo.delete(consumer_id);

          // cache에서 삭제
          void this.deleteConsumerDataToCache
            .deleteKey({ namespace, keyName: consumer_id })
            .catch(() => {});
        });

        consumer.on('transportclose', () => {
          consumer.close();
        });

        consumer.on('producerclose', () => {
          consumer.close();
        });

        // 메모리 저장
        this.consumerRepo.set(consumer_id, consumer);

        // created 목록에 넣어서 나중에 rollback 가능하게
        createdConsumers.push(consumer);
        createdConsumerIds.push(consumer_id);

        // insert용 데이터 쌓기
        insertPayload.consumer_info.push({
          consumer_id,
          producer_id: producerInfo.producer_id,
          status: producerInfo.status,
        });

        // 반환용 결과 쌓기
        results.push({
          producer_id: producerInfo.producer_id,
          consumer_id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      }

      // 따로 데이터 저장
      const inserted: boolean = await this.insertConsumerDatasToCache.insert(insertPayload);
      if (!inserted) {
        // 에러가 발생하면 consumer 삭제
        for (const c of createdConsumers) {
          try {
            c.close();
          } catch {}
        }
        throw new SfuErrorMessage('consumer 데이터를 저장하는데 에러가 발생했습니다.');
      }

      // 값 반환
      return results;
    } catch (err) {
      for (const c of createdConsumers) {
        try {
          c.close();
        } catch {}
      }
      // 여기서 좀 더 탄탄하게 코드를 짤 수도 있다.
      throw new SfuError(err);
    }
  }
}
