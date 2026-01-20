// 해당 user에 대한 screen과 관련된 데이터를 끈다.
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { Injectable } from '@nestjs/common';
import {
  StopScreenProducerCacheInfoResult,
  StopScreenProducerDto,
  StopScreenProducerResult,
} from '../dto';
import { SfuErrorMessage } from '@error/application/sfu/sfu.error';
import type { ProducerRepositoryPort } from '../../ports';
import { DeleteDataToCache } from '@app/ports/cache/cache.outbound';

type StopScreenProducerUsecaseProps<T> = {
  selectMainAndSubProducerFromCache: SelectDataFromCache<T>; // 해당 user_id, room_id에 해당하는 main, sub 가져오기
  deleteProducerInfoToCache: DeleteDataToCache<T>; // 불량 캐시에 경우 삭제해 준다.
};

@Injectable()
export class StopScreenProducerUsecase<T> {
  private readonly selectMainAndSubProducerFromCache: StopScreenProducerUsecaseProps<T>['selectMainAndSubProducerFromCache'];
  private readonly deleteProducerInfoToCache: StopScreenProducerUsecaseProps<T>['deleteProducerInfoToCache'];

  constructor(
    private readonly produce: ProducerRepositoryPort,
    {
      selectMainAndSubProducerFromCache,
      deleteProducerInfoToCache,
    }: StopScreenProducerUsecaseProps<T>,
  ) {
    this.selectMainAndSubProducerFromCache = selectMainAndSubProducerFromCache;
    this.deleteProducerInfoToCache = deleteProducerInfoToCache;
  }

  async execute(dto: StopScreenProducerDto): Promise<StopScreenProducerResult> {
    // 1. screen이 유저가 한게 맞는지 확인하는 로직
    const producerInfo: StopScreenProducerCacheInfoResult =
      await this.selectMainAndSubProducerFromCache.select({
        namespace: dto.room_id,
        keyName: dto.user_id,
      });
    if (!producerInfo.main_producer_id && !producerInfo.sub_producer_id)
      throw new SfuErrorMessage('화면공유는 화면공유를 킨 유저만 끌수 있습니다.');

    // 2. 맞다면 user screen에 관련된 producer를 내린다. -> 그 producer를 내린다면 자연스럽게 삭제가 되야 한다.
    if (producerInfo.main_producer_id)
      await this.deleteProducer(dto, producerInfo.main_producer_id, 'screen_video');
    if (producerInfo.sub_producer_id)
      await this.deleteProducer(dto, producerInfo.sub_producer_id, 'screen_audio');

    return {
      main: producerInfo.main_producer_id ? true : false,
      sub: producerInfo.sub_producer_id ? true : false,
    };
  }

  private async deleteProducer(
    dto: StopScreenProducerDto,
    producer_id: string,
    status: 'screen_video' | 'screen_audio',
  ): Promise<void> {
    const producer = this.produce.get(producer_id);
    // 없는 불량 캐시는 삭제
    if (!producer) {
      await this.deleteProducerInfoToCache.deleteKey({
        namespace: `${dto.room_id}:${dto.user_id}`,
        keyName: status,
      });
      return;
    }

    // cache 내리기
    producer.close();
  }
}
