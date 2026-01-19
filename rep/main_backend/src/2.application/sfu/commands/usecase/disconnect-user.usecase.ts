// 유저가 disconnect 했을때 정리해줄거
import { Injectable } from '@nestjs/common';
import type { TransportRepositoryPort } from '../../ports';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { DisconnectUserTransportInfos } from '../dto';

type DisconnectUserUsecaseProps<T> = {
  selectUserTransportFromCache: SelectDataFromCache<T>;
};

@Injectable()
export class DisconnectUserUsecase<T> {
  private readonly selectUserTransportFromCache: DisconnectUserUsecaseProps<T>['selectUserTransportFromCache'];

  constructor(
    private readonly transportRepo: TransportRepositoryPort,
    { selectUserTransportFromCache }: DisconnectUserUsecaseProps<T>,
  ) {
    this.selectUserTransportFromCache = selectUserTransportFromCache;
  }

  async execute(user_id: string): Promise<void> {
    // 1. user_id에 해당하는 transport_id를 찾는다.
    const transportInfo: DisconnectUserTransportInfos | undefined =
      await this.selectUserTransportFromCache.select({ namespace: user_id, keyName: '' });

    // 2. transport_id에 해당하는 값을 찾고 그 값에 transport를 가져오고 close
    const targets: Array<string> = [
      transportInfo?.send_transport_id,
      transportInfo?.recv_transport_id,
    ].filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (targets.length === 0) return;

    for (const transport_id of targets) {
      const transport = this.transportRepo.get(transport_id);
      if (!transport) continue;

      try {
        if (!transport.closed) transport.close();
      } finally {
        // repo에서 제거 (메모리에 죽은 참조 남기지 않기)
        try {
          this.transportRepo.delete(transport_id);
        } catch {}
      }
    }
  }
}
