import { idVo } from '@domain/shared';
import { OauthUserProps, providerIdVo, providerVo, userIdVo } from '@domain/user/user.vo';

export class OauthUser {
  private readonly id: OauthUserProps['id'];
  private readonly user_id: OauthUserProps['user_id'];
  private readonly provider: OauthUserProps['provider'];
  private readonly provider_id: OauthUserProps['provider_id'];
  private readonly created_at: Exclude<OauthUserProps['created_at'], undefined>;
  private readonly updated_at: Exclude<OauthUserProps['updated_at'], undefined>;

  constructor({
    id,
    user_id,
    provider,
    provider_id,
    created_at = new Date(),
    updated_at = new Date(),
  }: OauthUserProps) {
    this.id = idVo(id);
    this.user_id = userIdVo(user_id);
    this.provider = providerVo(provider);
    this.provider_id = providerIdVo(provider_id);
    this.created_at = created_at && created_at instanceof Date ? created_at : new Date();
    this.updated_at = updated_at && updated_at instanceof Date ? updated_at : new Date();

    Object.freeze(this);
  }

  public getId(): OauthUserProps['id'] {
    return this.id;
  }
  public getUserId(): OauthUserProps['user_id'] {
    return this.user_id;
  }
  public getProvider(): OauthUserProps['provider'] {
    return this.provider;
  }
  public getProviderId(): OauthUserProps['provider_id'] {
    return this.provider_id;
  }
  public getCreatedAt(): Exclude<OauthUserProps['created_at'], undefined> {
    return this.created_at;
  }
  public getUpdatedAt(): Exclude<OauthUserProps['updated_at'], undefined> {
    return this.updated_at;
  }

  public getData(): Required<OauthUserProps> {
    return {
      id: this.id,
      user_id: this.user_id,
      provider: this.provider,
      provider_id: this.provider_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
