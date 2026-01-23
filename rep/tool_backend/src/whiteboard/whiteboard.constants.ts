export const WHITEBOARD_GROUP = Object.freeze({
  WHITEBOARD: 'whiteboard:ws',
} as const);

// [Client -> Server] : 클라이언트가 보내는 이벤트
export const WHITEBOARD_EVENT_NAME = Object.freeze({
  HEALTH_CHECK: 'whiteboard:ws:health_check',

  CREATE_ELEMENT: 'whiteboard:element:create',
  UPDATE_ELEMENT: 'whiteboard:element:update',
  DELETE_ELEMENT: 'whiteboard:element:delete',
  CHANGE_LAYER: 'whiteboard:element:layer',
  CURSOR_MOVE: 'whiteboard:cursor:move',
} as const);

// [Server -> Client] : 서버가 보내는 이벤트
export const WHITEBOARD_CLIENT_EVENT_NAME = Object.freeze({
  PERMISSION: 'whiteboard:permission',

  REMOTE_CREATE_ELEMENT: 'whiteboard:remote:element:create',
  REMOTE_UPDATE_ELEMENT: 'whiteboard:remote:element:update',
  REMOTE_DELETE_ELEMENT: 'whiteboard:remote:element:delete',
  REMOTE_CHANGE_LAYER: 'whiteboard:remote:element:layer',
  REMOTE_CURSOR_MOVE: 'whiteboard:remote:cursor:move',
} as const);
