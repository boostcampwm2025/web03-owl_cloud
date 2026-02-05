import { Injectable, Logger } from '@nestjs/common';
import { ResumeConsumerDto } from '../dto';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import type { ConsumerRepositoryPort, ConsumerTimerRepositoryPort } from '../../ports';
import { SfuErrorMessage } from '@error/application/sfu/sfu.error';
import { Consumer } from 'mediasoup/types';

type ResumeConsumerUsecaseProps<T> = {
  selectConsumerInfoFromCache: SelectDataFromCache<T>; // cache에서 유저가 보낸 데이터를 기반으로 맞는지 확인함
};

@Injectable()
export class ResumeConsumerUsecase<T> {
  private readonly logger = new Logger(ResumeConsumerUsecase.name);
  private readonly selectConsumerInfoFromCache: ResumeConsumerUsecaseProps<T>['selectConsumerInfoFromCache'];

  constructor(
    private readonly consumerRepo: ConsumerRepositoryPort,
    private readonly consumerTimerRepo: ConsumerTimerRepositoryPort,
    { selectConsumerInfoFromCache }: ResumeConsumerUsecaseProps<T>,
  ) {
    this.selectConsumerInfoFromCache = selectConsumerInfoFromCache;
  }

  async execute(dto: ResumeConsumerDto): Promise<void> {
    // 1. 이것이 유저가 보낸 재개가 맞는지 확인하는 로직 ( 안정성을 위해서 )
    const checked: boolean = await this.selectConsumerInfoFromCache.select({
      namespace: `${dto.room_id}:${dto.user_id}`,
      keyName: dto.consumer_id,
    });
    if (!checked) throw new SfuErrorMessage('consumer_id를 다시 확인해주세요.');

    // 2. 특정 consumer 재개
    const consumer: Consumer | undefined = this.consumerRepo.get(dto.consumer_id);
    if (!consumer) throw new SfuErrorMessage('consumer_id에 해당하는 consumer를 찾지 못했습니다.');
    if (consumer.closed) throw new SfuErrorMessage('consumer가 이미 종료되었습니다.');
    if (!consumer.paused) return; // 작동 중이면 다시 나옴

    await consumer.resume();

    // 레이어가 main 일때만 업데이트 하도록 설정 일단은 임시 방편으로 해둔다.
    if (consumer.appData.type === 'cam' && consumer.type === 'simulcast') {
      await consumer.setPriority(200);
      await consumer.setPreferredLayers({ spatialLayer: 1 });
      await consumer.requestKeyFrame();

      // 0.3 이후에 가져오기
      const consumer_id: string = dto.consumer_id;
      this.consumerTimerRepo.clear(consumer_id);

      const t = setTimeout(async () => {
        try {
          const c = this.consumerRepo.get(consumer_id);
          if (!c || c.closed || c.paused) return;
          if (c.appData?.type !== 'cam' || c.type !== 'simulcast') return;

          await c.setPreferredLayers({ spatialLayer: 2 });
          await c.requestKeyFrame();
        } catch (err) {
          this.logger.debug(err);
        } finally {
          if (this.consumerTimerRepo.get(consumer_id) === t) {
            this.consumerTimerRepo.delete(consumer_id);
          }
        }
      }, 300);

      this.consumerTimerRepo.set(consumer_id, t); // consumer_id에 따른 데이터 저장
    }

    // encoding 할게 있을때 설정
    if (consumer.appData.type === 'screen_video') {
      await consumer.setPriority(255); // 가장 우선순위를 높게 해준다.

      const consumer_id = dto.consumer_id;
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
  }
}
