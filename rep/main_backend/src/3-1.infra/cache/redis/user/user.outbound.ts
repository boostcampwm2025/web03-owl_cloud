import { DeleteDataToCache, InsertDataToCache } from '@app/ports/cache/cache.outbound';
import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { InsertCacheDataProps } from '@app/auth/commands/usecase';
import {
  CACHE_USER_NAMESPACE_NAME,
  CACHE_USER_SESSION_KEY_NAME,
  REDIS_SERVER,
} from '../../cache.constants';

@Injectable()
export class InsertUserSessionDataToRedis extends InsertDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // 데이터 정합성을 유지시켜주고
  private async insertUserSession({
    cache,
    np,
    refresh_token_hash,
  }: {
    cache: RedisClientType<any, any>;
    np: string;
    refresh_token_hash: string;
  }): Promise<boolean> {
    await cache.watch(np); // 추적후 이거 변경할때 안에 값이 변경되면 변경 안되도록 함

    try {
      const tx = cache.multi();
      tx.hSet(np, CACHE_USER_SESSION_KEY_NAME.REFRESH_TOKEN_HASH, refresh_token_hash);
      tx.expire(np, 8 * 24 * 60 * 60);

      const insertChecked = await tx.exec();

      return insertChecked !== null;
    } finally {
      await cache.unwatch();
    }
  }

  public async insert(entity: InsertCacheDataProps): Promise<boolean> {
    const cache: RedisClientType<any, any> = this.cache;
    const np: string = `${CACHE_USER_NAMESPACE_NAME.SESSION_USER}:${entity.user_id}`;

    const insertChecked: boolean = await this.insertUserSession({
      cache,
      np,
      refresh_token_hash: entity.refresh_token_hash,
    });

    return insertChecked;
  }
}

// 지금 당장은 key 값 하나 삭제인데 user내에서는 얼마든지 확장 가능하도록 생각해봐야 겠다.
@Injectable()
export class DeleteUserDataToRedis extends DeleteDataToCache<RedisClientType<any, any>> {
  constructor(@Inject(REDIS_SERVER) cache: RedisClientType<any, any>) {
    super(cache);
  }

  // keyname 삭제
  public async deleteKey({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<boolean> {
    const cache: RedisClientType<any, any> = this.cache;

    // 삭제가 되거나 나중에 삭제 되도 일단 삭제로 처리하도록 하자 -> 여기서는 정합성은 고려할 필요는 없어 보인다.
    await cache.hDel(namespace, keyName);

    return true;
  }
}
