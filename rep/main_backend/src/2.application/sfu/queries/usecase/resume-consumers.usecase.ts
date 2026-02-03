import { Injectable, Logger } from '@nestjs/common';
import { ResumeConsumersDto } from '../dto';
import { SelectDatasFromCache } from '@app/ports/cache/cache.inbound';
import type { ConsumerRepositoryPort } from '../../ports';
import { Consumer } from 'mediasoup/types';

type ResumeConsumersUsecaseProps<T> = {
  selectConsumerInfosFromCache: SelectDatasFromCache<T>; // cache에서 유저가 보낸 데이터를 기반으로 맞는지 확인함
};

@Injectable()
export class ResumeConsumersUsecase<T> {
  private readonly logger = new Logger(ResumeConsumersUsecase.name);
  private readonly selectConsumerInfosFromCache: ResumeConsumersUsecaseProps<T>['selectConsumerInfosFromCache'];

  constructor(
    private readonly consumerRepo: ConsumerRepositoryPort,
    { selectConsumerInfosFromCache }: ResumeConsumersUsecaseProps<T>,
  ) {
    this.selectConsumerInfosFromCache = selectConsumerInfosFromCache;
  }

  async execute(dto: ResumeConsumersDto): Promise<void> {
    // 1. 이것이 유저가 보낸 것중 맞는 consumer_id만 가져오기
    const checkConsumerIds: Array<string> = await this.selectConsumerInfosFromCache.selectKeys({
      namespace: `${dto.room_id}:${dto.user_id}`,
      keyNames: dto.consumer_ids,
    });
    if (checkConsumerIds.length === 0) return; // 맞는 것이 없다면 그냥 흘린다.

    // 2. 특정 consumer 재개
    const resumeConsume = checkConsumerIds.map(async (consumer_id: string) => {
      const consumer: Consumer | undefined = this.consumerRepo.get(consumer_id);
      if (!consumer) {
        this.logger.warn('consumer_id에 해당하는 consumer를 찾지 못했습니다.');
        return;
      }
      if (consumer.closed) {
        this.logger.warn('consumer가 이미 종료되었습니다.');
        return;
      }
      if (!consumer.paused) return; // 작동 중이면 다시 나옴

      try {
        await consumer.resume();

        if (consumer.appData.type === 'cam' && consumer.type === 'simulcast') {
          consumer.setPriority(10);
          await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
        };

        if (consumer.appData.type === 'screen_video') {
          consumer.setPriority(300); // 가장 우선순위를 높게 해준다.
        };
      } catch (err) {
        this.logger.error(err);
      }
    });

    await Promise.all(resumeConsume);
  }
}
