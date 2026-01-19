import { Injectable } from '@nestjs/common';
import { ResumeConsumerDto } from '../dto';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import type { ConsumerRepositoryPort } from '../../ports';
import { SfuErrorMessage } from '@error/application/sfu/sfu.error';
import { Consumer } from 'mediasoup/types';

type ResumeConsumerUsecaseProps<T> = {
  selectConsumerInfoFromCache: SelectDataFromCache<T>; // cache에서 유저가 보낸 데이터를 기반으로 맞는지 확인함
};

@Injectable()
export class ResumeConsumerUsecase<T> {
  private readonly selectConsumerInfoFromCache: ResumeConsumerUsecaseProps<T>['selectConsumerInfoFromCache'];

  constructor(
    private readonly consumerRepo: ConsumerRepositoryPort,
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
  }
}
