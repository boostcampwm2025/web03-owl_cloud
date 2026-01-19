// 로그아웃을 담당하는 유스케이스
import { DeleteDataToCache } from '@app/ports/cache/cache.outbound';
import { type Payload } from '@app/auth/commands/dto';

type LogoutUsecaseValueProps = {
  userSessionNamespace: string;
  refreshTokenHashKeyName: string;
};

type LogoutUsecaseProps<T> = {
  usecaseValues: LogoutUsecaseValueProps;
  deleteUserSessionToCache: DeleteDataToCache<T>;
};

export class LogoutUseCase<T> {
  private readonly usecaseValues: LogoutUsecaseProps<T>['usecaseValues'];
  private readonly deleteUserSessionToCache: LogoutUsecaseProps<T>['deleteUserSessionToCache'];

  constructor({ usecaseValues, deleteUserSessionToCache }: LogoutUsecaseProps<T>) {
    this.usecaseValues = usecaseValues;
    this.deleteUserSessionToCache = deleteUserSessionToCache;
  }

  public async execute(dto: Payload): Promise<void> {
    // 1. redis에서 세션 정보 초기화
    await this.deleteUserSessionToCache.deleteKey({
      namespace: `${this.usecaseValues.userSessionNamespace}:${dto.user_id}`,
      keyName: this.usecaseValues.refreshTokenHashKeyName,
    });

    // 2. blacklist에 해당 refresh_token 을 추가할 수 도 있다. - 그러면 로그인 로직 또한 수정해주어야 함 -> 추가가 필요할때 해주자
    return;
  }
}
