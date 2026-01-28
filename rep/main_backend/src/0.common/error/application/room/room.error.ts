import { BaseError } from '../../error';

export class NotInsertRoomDataToCache extends BaseError {
  constructor() {
    super({
      message: '데이터가 cache에 저장되지 않았습니다.',
      status: 500,
    });
  }
}

export class NotInsertRoomDataToDb extends BaseError {
  constructor() {
    super({
      message: '데이터가 db에 저장되지 않았습니다.',
      status: 500,
    });
  }
}

export class NotRoomData extends BaseError {
  constructor() {
    super({
      message: '방 코드 번호를 다시 확인해주시길 바랍니다.',
      status: 409,
    });
  }
}

export class NotInputRoomPassword extends BaseError {
  constructor() {
    super({
      message: '방에 비밀번호를 입력해주시길 바랍니다.',
      status: 404,
    });
  }
}

export class NotAcceptRoomPassword extends BaseError {
  constructor() {
    super({
      message: '방에 비밀번호를 다시 확인해주시길 바랍니다.',
      status: 409,
    });
  }
}

export class NotRoomInfoData extends BaseError {
  constructor() {
    super({
      message: '방 정보를 가지고 있는 데이터가 존재하지 않습니다.',
      status: 500,
    });
  }
}

export class NotAcceptRoomMembers extends BaseError {
  constructor() {
    super({
      message: '방에 허용 가능 인원이 가득찼습니다.',
      status: 500,
    });
  }
}

export class NotAllowRoomParticipantData extends BaseError {
  constructor() {
    super({
      message: '방에 입장 기록이 저장되지 않았습니다.',
      status: 500,
    });
  }
}

export class NotAllowRoomDataUpdate extends BaseError {
  constructor() {
    super({
      message: '방에 대한 정보가 업데이트 되지 않았습니다.',
      status: 500,
    });
  }
}

export class NotAllowRoomMember extends BaseError {
  constructor() {
    super({
      message: '현재 방에 위치에 있지 않거나 이미 다른 main producer가 실행중입니다.',
      status: 500,
    });
  }
}

export class NotInsertRoomTicketData extends BaseError {
  constructor() {
    super({
      message: '방에 ticket정보가 저장되지 않았습니다.',
      status: 500,
    });
  }
}

export class NotAllowRoomMemberOne extends BaseError {
  constructor() {
    super({
      message: '현재 방에 위치에 있지 않거나 main producer가 다릅니다.',
      status: 500,
    });
  }
}

export class NotAllowFileSize extends BaseError {
  constructor(size: number) {
    super({
      message: `파일의 크기는 ${size}를 넘어서는 안됩니다.`,
      status: 500,
    });
  }
}

export class NotFoundResult extends BaseError {
  constructor() {
    super({
      message: `파일 다운로드를 위한 결과값을 만들지 못했습니다.`,
      status: 500,
    });
  }
}
export class NotAllowRoomMemberFile extends BaseError {
  constructor() {
    super({
      message: `현재 방에 위치해 있지 않거나 정보를 잘못보내셨습니다.`,
      status: 500,
    });
  }
}

export class NotAllowRoomFileData extends BaseError {
  constructor(name: string) {
    super({
      message: `파일을 전송하는데 ${name}에 값이 잘못보내졌습니다.`,
      status: 500,
    });
  }
}

export class NotAllowUpdateFileData extends BaseError {
  constructor() {
    super({
      message: '파일 데이터에 상태를 업데이트 하지 못했습니다.',
      status: 500,
    });
  }
}

export class NotAllowUpdatePassword extends BaseError {
  constructor() {
    super({
      message: '방이 존재하지 않거나, 해당 작업을 수행할 권한이 없습니다.',
      status: 500,
    });
  }
}

export class NotChangePassword extends BaseError {
  constructor() {
    super({
      message: '일시적인 서버 문제로 비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.',
      status: 500,
    });
  }
}
