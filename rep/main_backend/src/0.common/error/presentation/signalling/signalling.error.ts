import { BaseError } from '../../error';

export class NotConnectSignalling extends BaseError {
  constructor() {
    super({
      message: '화상 회의방에 연결하지 못했습니다.',
      status: 500,
    });
  }
}

export class NotValiedTickeKey extends BaseError {
  constructor() {
    super({
      message: '티켓을 만들 비밀키가 없습니다.',
      status: 500,
    });
  }
}
