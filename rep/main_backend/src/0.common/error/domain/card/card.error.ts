import { BaseError } from "../../error";


export class NotAllowStatusValue extends BaseError {
  constructor() {
    super({
      message: '카드에 상태를 다시 확인해주세요',
      status: 500,
    });
  };
};

export class NotAllowBackgroundColor extends BaseError {
  constructor() {
    super({
      message : "배경 색깔의 형식을 다시 확인해 주세요.",
      status : 500
    })
  };
};  

export class NotAllowCardItemType extends BaseError {
  constructor() {
    super({
      message : "카드 아이템 타입을 다시 확인해주세요",
      status : 500
    })
  };
};  

export class NotAllowRangeType extends BaseError {
  constructor({ name, min, max } : { name : string, min : number, max : number }) {
    super({
      message : `${name}은 ${min}이상 ${max}이하 여야 합니다.`,
      status : 500
    });
  };
};  

export class NotAllowTextFillType extends BaseError {
  constructor() {
    super({
      message : "카드 텍스트의 색깔 타입을 다시 확인해주시길 바랍니다.",
      status : 500
    })
  };
};

export class NotAllowTextAlignType extends BaseError {
  constructor() {
    super({
      message : "카드 텍스트의 align의 종류를 다시 확인해주시길 바랍니다.",
      status : 500
    })
  };
};

export class NotAllowCardItemIamgeMimeType extends BaseError {
  constructor() {
    super({
      message : "카드 이미지의 mime_type의 종류를 다시 확인해주시길 바랍니다.",
      status : 500
    })
  };
};

export class NotAllowCardItemIamgeStatusValue extends BaseError {
  constructor() {
    super({
      message : "카드 이미지 업로드 상태의 상태값을 다시 확인해주시길 바랍니다.",
      status : 500
    })
  };
};

export class NotAllowCreateCardItemCheckType extends BaseError {
  constructor() {
    super({
      message : "text type이외에 다른 타입은 assets을 같이 저장해주어야 합니다.",
      status : 500
    })
  };
};