
// websocket연결 path 
export const WEBSOCKET_PATH = "/api/ws/"

// websocket 연결할때 사용하는 namespace
export const WEBSOCKET_NAMESPACE = Object.freeze({
  SIGNALING : "/signal"
} as const);

export const WEBSOCKET_AUTH_CLIENT_EVENT_NAME = Object.freeze({
  ACCESS_TOKEN : "auth:access_token",
  ERROR : "auth:error"
} as const);

// 
export const WEBSOCKET_SIGNALING_EVENT_NAME = Object.freeze({
  JOIN_ROOM : "signaling:ws:join_room",
  CONNECT_ROUTER : "signaling:ws:connect_router"
} as const);

export const WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME = Object.freeze({
  JOINED : "room:joined"
} as const);