export const WHITEBOARD_GROUP = Object.freeze({
  WHITEBOARD: 'whiteboard:ws',
} as const);

// client에게 받는 이름입니다.
export const WHITEBOARD_EVENT_NAME = Object.freeze({
  HEALTH_CHECK: 'whiteboard:ws:health_check',
} as const);

// client에게 보내는 이름입니다.
export const WHITEBOARD_CLIENT_EVENT_NAME = Object.freeze({
  PERMISSION: 'whiteboard:permission',
} as const);
