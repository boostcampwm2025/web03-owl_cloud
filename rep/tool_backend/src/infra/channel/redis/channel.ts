import { Global, Module } from '@nestjs/common';

// 나중에 sse가 필요하다면 그때 또 추가하는 방향도 있습니다.
@Global()
@Module({})
export class RedisChannelModule {}
