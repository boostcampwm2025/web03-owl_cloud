import {
  userIdVo,
  emailVo,
  nicknameVo,
  passwordHashVo,
  type UserProps,
} from '@domain/user/user.vo';

// User entity로 쓰일 객체
export class User {
  private readonly user_id: UserProps['user_id'];
  private readonly email: UserProps['email'];
  private readonly nickname: UserProps['nickname'];
  private readonly password_hash: UserProps['password_hash'];
  private readonly created_at: Exclude<Required<UserProps['created_at']>, undefined>;
  private readonly updated_at: Exclude<Required<UserProps['updated_at']>, undefined>;

  constructor({
    user_id,
    email,
    nickname,
    password_hash,
    created_at = new Date(),
    updated_at = new Date(),
  }: UserProps) {
    this.user_id = userIdVo(user_id);
    this.email = emailVo(email);
    this.nickname = nicknameVo(nickname);
    this.password_hash = password_hash ? passwordHashVo(password_hash) : undefined;
    this.created_at = created_at instanceof Date ? created_at : new Date();
    this.updated_at = updated_at instanceof Date ? updated_at : new Date();
    Object.freeze(this);
  }

  public getUserId(): UserProps['user_id'] {
    return this.user_id;
  }
  public getEmail(): UserProps['email'] {
    return this.email;
  }
  public getNickName(): UserProps['nickname'] {
    return this.nickname;
  }
  public getPasswordHash(): UserProps['password_hash'] {
    return this.password_hash;
  }
  public getCreatedAt(): Exclude<UserProps['created_at'], undefined> {
    return this.created_at;
  }
  public getUpdatedAt(): Exclude<UserProps['updated_at'], undefined> {
    return this.updated_at;
  }

  public getData(): Required<UserProps> {
    return {
      user_id: this.user_id,
      email: this.email,
      nickname: this.nickname,
      password_hash: this.password_hash,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // 각종 함수를 아래에 포함할 계획
}
