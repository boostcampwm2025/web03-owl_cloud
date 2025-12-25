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

export class DiskError extends BaseError {
  constructor(err : Error) {
    super({
      message : `${err}`,
      status : 500
    })
  }
};

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