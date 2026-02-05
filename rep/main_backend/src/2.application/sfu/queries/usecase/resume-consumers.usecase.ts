import { Injectable, Logger } from '@nestjs/common';
import { ResumeConsumersDto } from '../dto';
import { SelectDatasFromCache } from '@app/ports/cache/cache.inbound';
import type { ConsumerRepositoryPort, ConsumerTimerRepositoryPort } from '../../ports';
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
    private readonly consumerTimerRepo: ConsumerTimerRepositoryPort,
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
          await consumer.setPriority(10);
          await consumer.setPreferredLayers({ spatialLayer: 2 });
          await consumer.requestKeyFrame();
        }

        // screen일 경우에
        if (consumer.appData.type === 'screen_video') {
          await consumer.setPriority(255); // 가장 우선순위를 높게 해준다.

          this.consumerTimerRepo.clear(consumer_id);

          if (consumer.type === 'simulcast') {
            // simulcast인 경우 초반 뭉게짐을 좀 개선해주는 것이 좋을 수 있다.
            await consumer.setPreferredLayers({ spatialLayer: 0 });
            await consumer.requestKeyFrame();

            const t = setTimeout(async () => {
              try {
                // 예외 처리
                const c = this.consumerRepo.get(consumer_id);
                if (!c || c.closed || c.paused) return;
                if (c.appData?.type !== 'screen_video' || c.type !== 'simulcast') return;

                // 화면 업그레이드
                await c.setPreferredLayers({ spatialLayer: 1 });
                await c.requestKeyFrame();
              } catch (e) {
                this.logger.debug(e);
              } finally {
                if (this.consumerTimerRepo.get(consumer_id) === t) {
                  this.consumerTimerRepo.delete(consumer_id);
                }
              }
            }, 200);

            this.consumerTimerRepo.set(consumer_id, t);
            return;
          }

          await consumer.requestKeyFrame();
        }
      } catch (err) {
        this.logger.error(err);
      }
    });

    await Promise.all(resumeConsume);
  }
}
