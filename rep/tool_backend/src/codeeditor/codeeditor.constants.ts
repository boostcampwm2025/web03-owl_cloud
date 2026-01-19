export const CODEEDITOR_GROUP = Object.freeze({
  CODEEDITOR: 'codeeditor:ws',
} as const);

// client에게 받는 이름입니다.
export const CODEEDITOR_EVENT_NAME = Object.freeze({
  HEALTH_CHECK: 'codeeditor:ws:health_check',
} as const);

// client에게 보내는 이름입니다.
export const CODEEDITOR_CLIENT_EVENT_NAME = Object.freeze({
  PERMISSION: 'codeeditor:permission',
} as const);
