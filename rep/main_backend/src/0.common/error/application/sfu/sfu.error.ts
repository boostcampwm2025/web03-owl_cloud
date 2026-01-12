import { BaseError } from '../../error';

export class SfuError extends BaseError {
  constructor(err: Error) {
    super({
      message: `${err}`,
      status: 500,
    });
  }
}

export class SfuErrorMessage extends BaseError {
  constructor(message : string) {
    super({
      message,
      status: 500,
    });
  }
}