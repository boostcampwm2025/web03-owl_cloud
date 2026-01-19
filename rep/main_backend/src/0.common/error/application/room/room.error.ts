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
