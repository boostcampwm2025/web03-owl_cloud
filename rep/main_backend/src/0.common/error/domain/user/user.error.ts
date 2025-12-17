import { BaseError } from '@error/error';

export class NotEmptyError extends BaseError {
  constructor(name: string) {
    super({
      message: `${name}은 반드시 존재해야 합니다.`,
      status: 500,
    });
  }
}

export class NotAllowType extends BaseError {
  constructor({ name, type }: { name: string; type: string }) {
    super({
      message: `${name}은 ${type}이어야 합니다.`,
      status: 500,
    });
  }
}

export class NotTypeUUidV7 extends BaseError {
  constructor(name: string) {
    super({
      message: `${name}은 uuid v7을 만족해야 합니다.`,
      status: 500,
    });
  }
}

export class NotTypeEmail extends BaseError {
  constructor() {
    super({
      message: '이메일 타입을 만족하지 않습니다.',
      status: 500,
    });
  }
}

export class NotAllowMaxLengthText extends BaseError {
  constructor({ name, length }: { name: string; length: number }) {
    super({
      message: `${name}은 최대 ${length}까지만 가능합니다.`,
      status: 500,
    });
  }
}

export class NotTypeHash extends BaseError {
  constructor() {
    super({
      message: 'hash타입을 맞춰주셔야 합니다.',
      status: 500,
    });
  }
}

export class NotAllowMinValue extends BaseError {
  constructor({ name, min }: { name: string; min: number }) {
    super({
      message: `${name}은 최소 ${min}값입니다.`,
      status: 500,
    });
  }
}

export class NotAllowMaxValue extends BaseError {
  constructor({ name, max }: { name: string; max: number }) {
    super({
      message: `${name}은 최대 ${max}값입니다.`,
      status: 500,
    });
  }
}

export class NotAllowProviderType extends BaseError {
  constructor(types: Array<string>) {
    super({
      message: `현재 이용가능한 회원 서비스는 ${types.join(', ')} 입니다.`,
      status: 500,
    });
  }
}

export class NotAllowMimeType extends BaseError {
  constructor(types: Array<string>) {
    super({
      message: `가능한 이미지의 mime type은 ${types.join(', ')} 입니다.`,
      status: 500,
    });
  }
}
