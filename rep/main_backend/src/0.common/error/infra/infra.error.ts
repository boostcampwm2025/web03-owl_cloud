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
  constructor(err : Error) {
    super({
      message : `${err}`,
      status : 500
    });
  }
}

export class CacheError extends BaseError {
  constructor(message : string) {
    super({
      message : `${message}`,
      status : 500
    });
  }
}
