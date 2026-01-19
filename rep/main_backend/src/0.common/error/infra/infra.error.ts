import { BaseError } from '../error';

export class DatabaseError extends BaseError {
  constructor(err: Error) {
    super({
      message: `${err}`,
      status: 500,
    });
  }
}

export class NotMakeJwtToken extends BaseError {
  constructor() {
    super({
      message: 'jwt 토큰을 생성하는데 오류가 발생했습니다.',
      status: 500,
    });
  }
}

export class TokenExpiredError extends Error {
  readonly code = 'TOKEN_EXPIRED';
  constructor(message = 'token expired') {
    super(message);
  }
}

export class InvalidTokenError extends Error {
  readonly code = 'TOKEN_INVALID';
  constructor(message = 'token invalid') {
    super(message);
  }
}

export class ChannelError extends BaseError {
  constructor(err: Error) {
    super({
      message: `${err}`,
      status: 500,
    });
  }
}

export class CacheError extends BaseError {
  constructor(message: string) {
    super({
      message: `${message}`,
      status: 500,
    });
  }
}

export class NotFoundRefereceError extends BaseError {
  constructor(message: string) {
    super({
      message,
      status: 404,
    });
    this.name = 'NotFoundError';
  }
}

export class NotInsertDatabaseError extends BaseError {
  constructor(name: string) {
    super({
      message: `${name} 데이터를 입력하지 못했습니다.`,
      status: 404,
    });
  }
}

export class DiskError extends BaseError {
  constructor(err: Error) {
    super({
      message: `${err}`,
      status: 500,
    });
  }
}

export class NotCompleteDataToDisk extends BaseError {
  constructor() {
    super({
      message: '아직 모든 파일을 업로드 하지 않았습니다.',
      status: 500,
    });
  }
}

export class NotMakeUploadId extends BaseError {
  constructor() {
    super({
      message: 'upload_id를 만들지 못했습니다.',
      status: 500,
    });
  }
}

export class NotDeleteCardItem extends BaseError {
  constructor() {
    super({
      message: 'card_item을 삭제하지 못했습니다.',
      status: 500,
    });
  }
}

export class NotAllowToolPayload extends BaseError {
  constructor() {
    super({
      message: 'tool에서 보낸 payload에 user_id와 tool이 없습니다.',
      status: 500,
    });
  }
}

export class NotAllowToolTicket extends BaseError {
  constructor() {
    super({
      message: '이미 검증되었거나 ticket이 존재하지 않습니다.',
      status: 500,
    });
  }
}
