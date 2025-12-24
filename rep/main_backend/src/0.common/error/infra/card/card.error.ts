import { BaseError } from "../../error";


export class NotFoundRefereceError extends BaseError {
  constructor(message: string) {
    super({
      message, status : 404
    });
    this.name = "NotFoundError";
  }
}

export class NotInsertDatabaseError extends BaseError {
  constructor(name: string) {
    super({
      message: `${name} 데이터를 입력하지 못했습니다.`,
      status : 404
    });
  }
}