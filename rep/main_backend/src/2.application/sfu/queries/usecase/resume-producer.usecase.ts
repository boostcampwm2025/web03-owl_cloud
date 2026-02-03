import { Injectable } from '@nestjs/common';
import { PauseProducerDto, ResumeProducerDto } from '../dto';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { DeleteDataToCache, UpdateDataToCache } from '@app/ports/cache/cache.outbound';
import type { ProducerRepositoryPort } from '../../ports';
import { SfuError, SfuErrorMessage } from '@error/application/sfu/sfu.error';
import { Producer } from 'mediasoup/types';

type resumeProducerUsecaseProps<T> = {
  selectUserProduceFromCache: SelectDataFromCache<T>; // 유저 producer를 찾을때 사용하는 객체
  deleteUserProduceToCache: DeleteDataToCache<T>; // 만약 유령 producer가 존재할경우 업데이트 해주는 로직
  updateUserProduceToCache: UpdateDataToCache<T>; // 유저의 produce의 상태를 업데이틑 해주는 로직
};

@Injectable()
export class resumeProducerUsecase<T> {
  private readonly selectUserProduceFromCache: resumeProducerUsecaseProps<T>['selectUserProduceFromCache'];
  private readonly deleteUserProduceToCache: resumeProducerUsecaseProps<T>['deleteUserProduceToCache'];
  private readonly updateUserProduceToCache: resumeProducerUsecaseProps<T>['updateUserProduceToCache'];

  constructor(
    private readonly produceRepo: ProducerRepositoryPort, // producer들이 모여 있는 port
    {
      selectUserProduceFromCache,
      deleteUserProduceToCache,
      updateUserProduceToCache,
    }: resumeProducerUsecaseProps<T>,
  ) {
    this.selectUserProduceFromCache = selectUserProduceFromCache;
    this.deleteUserProduceToCache = deleteUserProduceToCache;
    this.updateUserProduceToCache = updateUserProduceToCache;
  }

  // 실제로 멈추게 하는 로직
  async execute(dto: ResumeProducerDto): Promise<void> {
    // 1. 실제로 방에 위치해 있고 유저가 맞는지 확인 ( ON도 맞는지 확인 )
    const checked: boolean = await this.selectUserProduceFromCache.select({
      namespace: `${dto.room_id}:${dto.user_id}`,
      keyName: dto.kind,
    });
    if (!checked) throw new SfuErrorMessage('유저가 실제로 방에 있지 않습니다.');

    // 2. 그 유저의 producer를 멈춤 한다.
    const producer: Producer | undefined = this.produceRepo.get(dto.producer_id);
    if (!producer) {
      await this.deleteUserProduceToCache.deleteKey({
        namespace: `${dto.room_id}:${dto.user_id}`,
        keyName: dto.kind,
      });
      throw new SfuErrorMessage('유저에 producer가 존재하지 않습니다.'); // 유령 데이터 정리
    }

    if (producer.paused) await producer.resume(); // 멈춘다.

    // 3. 상태를 변경해준다. // 1. producer에 cache에서 off를 해준다. ( 추가로 전체 정보를 가져올때 로직도 수정이 필요 + 기존의  )
    await this.updateUserProduceToCache.updateKey({
      namespace: `${dto.room_id}:${dto.user_id}`,
      keyName: dto.kind,
      updateValue: 'on',
    });
  }
}
