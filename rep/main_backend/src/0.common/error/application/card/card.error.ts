import { BaseError } from "../../error";


export class NotCreateCardStateError extends BaseError {
  constructor() {
    super({
      message: 'card state를 만들지 못했습니다.',
      status: 500,
    });
  }
};

export class NotCreateCardAndCardStateError extends BaseError {
  constructor() {
    super({
      message: 'card와 card state를 db에 생성하지 못했습니다.',
      status: 500,
    });
  };
};

export class NotCreateCardItemData extends BaseError {
  constructor() {
    super({
      message: 'card item을 생성하지 못했습니다.',
      status: 500,
    });
  };
};

export class NotAllowCreateCardItemNotUploadInfo extends BaseError {
  constructor() {
    super({
      message: 'upload용 데이터에 데이터를 추가하지 않았습니다.,',
      status: 500,
    });
  };
};

export class NotFoundCardItemAssetKeyName extends BaseError {
  constructor() {
    super({
      message: 'card_item asset에 key_name을 찾지 못했습니다.',
      status: 500,
    });
  };
};