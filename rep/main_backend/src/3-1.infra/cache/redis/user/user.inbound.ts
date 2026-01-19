import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { REDIS_SERVER } from '../../cache.constants';

/** hset으로 저장된 데이터에서 값을 가져오고 싶을때 사용 */
@Injectable()
export class SelectHsetDataFromRedis extends SelectDataFromCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  public async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<string | undefined> {
    // cache 정리
    const cache: RedisClientType<any, any> = this.cache;

    const data: string | null = await cache.hGet(namespace, keyName);

    return data || undefined;
  }
}
