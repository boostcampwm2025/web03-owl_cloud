// 인증 로직이 들어온다.
import { Injectable } from '@nestjs/common';
import { JwtAuth } from '@app/auth/queries/usecase';
import { type TokenDto } from '@app/auth/commands/dto';
import { type PayloadRes } from '@app/auth/queries/dto';
import { UnthorizedError } from '@error/application/user/user.error';

@Injectable()
export class JwtWsGuard {
  constructor(private readonly authUsecase: JwtAuth<unknown>) {}

  public async execute(dto: TokenDto): Promise<PayloadRes> {
    // jwt 인증
    const payload: PayloadRes | undefined = await this.authUsecase.execute(dto);

    // 추가적인 로직이 필요하면 여기에서 진행해야 한다.
    if (!payload) throw new UnthorizedError('payload가 생성되지 않았습니다.');

    return payload;
  }
}
