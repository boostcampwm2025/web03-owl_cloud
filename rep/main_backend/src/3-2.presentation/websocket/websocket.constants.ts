
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

// 웹소켓에 시그널링 서버에게 보내는 이벤트 이름
export const WEBSOCKET_SIGNALING_EVENT_NAME = Object.freeze({
  JOIN_ROOM : "signaling:ws:join_room",
  NEGOTIATE_SDP : "signaling:ws:negotiate_sdp",
  NEGOTIATE_ICE : "signaling:ws:negotiate_ice",
  DTLS_HANDSHAKE : "signaling:ws:dtls_handshake",
  PRODUCE : "signaling:ws:produce",
  CONSUME : "signaling:ws:consume",
  RESUME : "signaling:ws:resume", // 여러가지로 요긴하게 쓸수 있을것 같다. ( consume을 다시 재개 당연히 stop도 있으면 좋을것 같다. )
  ROOM_MEMBERS : "signaling:ws:room_members"
} as const);

export const WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME = Object.freeze({
  JOINED : "room:joined",
  ADMISSION : "room:admission",
  NEW_PRODUCED : "room:new_produced",
  NEW_USER : "room:new_user",
  USER_CLOSED : "room:user_closed",
} as const);