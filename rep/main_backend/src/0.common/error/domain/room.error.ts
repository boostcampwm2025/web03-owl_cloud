import { BaseError } from "../error";


export class NotAcceptEqualLengthError extends BaseError {
  constructor({ name, length } : { name : string, length : number }) {
    super({
      message : `${name}은 ${length}길이여야 합니다.`,
      status : 500
    });
  };
};

export class NotAllowRoomStatusError extends BaseError {
  constructor() {
    super({
      message: 'status를 다시 확인해주세요',
      status: 500,
    });
  }
}