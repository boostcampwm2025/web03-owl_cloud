import { User, OauthUser, UserProfile } from '@domain/user/entities';
import { OauthUserProps, UserProfileProps, UserProps } from '@domain/user/user.vo';
import { IdGenerator } from '@domain/shared';

// 유저를 생성할때 필요한 타입 정리
export type CreateUserInput = Pick<UserProps, 'email' | 'nickname' | 'password_hash'>;

// oauth 관련 해서 생성할때 필요한 타입 정리
export type ConnectOauthInput = Required<Omit<OauthUserProps, 'id' | 'user_id'>>;

// user_profile 관련해서 생성할때 필요한 타입 정리
export type UpsertProfileInput = Pick<UserProfileProps, 'user_id' | 'profile_path' | 'mime_type'>;

// 각 entity 진입점
export class UserAggregate {
  private readonly user: User;
  private readonly oauthUser?: OauthUser;
  private readonly profile?: UserProfile;

  constructor({
    user,
    oauthUser,
    profile,
  }: {
    user: User;
    oauthUser?: OauthUser;
    profile?: UserProfile;
  }) {
    this.user = user;
    this.oauthUser = oauthUser;
    this.profile = profile;
    Object.freeze(this);
  }

  // 유저를 새로 생성 할때 사용하는 함수
  public static create({
    input,
    userIdGenerator,
  }: {
    input: CreateUserInput;
    userIdGenerator: IdGenerator;
  }): UserAggregate {
    const now = new Date();

    const user = new User({
      user_id: userIdGenerator.generate(),
      email: input.email,
      nickname: input.nickname,
      password_hash: input.password_hash,
      created_at: now,
      updated_at: now,
    });

    return new UserAggregate({ user });
  }

  // oauth에 연결할때 사용
  public connectOauth(input: ConnectOauthInput): UserAggregate {
    const oauthUser = new OauthUser({
      id: 1,
      user_id: this.getUserId(),
      provider: input.provider,
      provider_id: input.provider_id,
      created_at: input.created_at,
      updated_at: input.updated_at,
    });

    return new UserAggregate({
      user: this.user,
      oauthUser,
      profile: this.profile,
    });
  }

  public upsertProfile(input: UpsertProfileInput) {
    const profile = new UserProfile({
      id: 1,
      user_id: this.getUserId(),
      profile_path: input.profile_path,
      mime_type: input.mime_type,
    });

    return new UserAggregate({
      user: this.user,
      oauthUser: this.oauthUser,
      profile,
    });
  }

  // getter 부분
  public getUser(): User {
    return this.user;
  }
  public getUserData(): UserProps {
    return this.user.getData();
  }
  public getUserId(): UserProps['user_id'] {
    return this.user.getUserId();
  }
  public getOauthUser(): OauthUser | undefined {
    return this.oauthUser;
  }
  public getOauthUserData(): Required<OauthUserProps> | undefined {
    return this.oauthUser?.getData();
  }
  public getProfile(): UserProfile | undefined {
    return this.profile;
  }
  public getProfileData(): Required<UserProfileProps> | undefined {
    return this.profile?.getData();
  }
}
