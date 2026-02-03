// websocket연결 path
export const WEBSOCKET_PATH = process.env.NODE_BACKEND_WEBSOCKET_PREFIX;

// websocket 연결할때 사용하는 namespace
export const WEBSOCKET_NAMESPACE = Object.freeze({
  SIGNALING: '/signal',
} as const);

export const WEBSOCKET_AUTH_CLIENT_EVENT_NAME = Object.freeze({
  ACCESS_TOKEN: 'auth:access_token',
  ERROR: 'auth:error',
} as const);

// 웹소켓에 시그널링 서버에게 보내는 이벤트 이름
export const WEBSOCKET_SIGNALING_EVENT_NAME = Object.freeze({
  JOIN_ROOM: 'signaling:ws:join_room',
  NEGOTIATE_SDP: 'signaling:ws:negotiate_sdp',
  NEGOTIATE_ICE: 'signaling:ws:negotiate_ice',
  DTLS_HANDSHAKE: 'signaling:ws:dtls_handshake',
  PRODUCE: 'signaling:ws:produce',
  CONSUME: 'signaling:ws:consume',
  RESUME: 'signaling:ws:resume', // 여러가지로 요긴하게 쓸수 있을것 같다. ( consume을 다시 재개 당연히 stop도 있으면 좋을것 같다. )
  PAUSE: 'signaling:ws:pause',
  ROOM_MEMBERS: 'signaling:ws:room_members',
  CONSUMES: 'signaling:ws:consumes',
  RESUMES: 'signaling:ws:resumes',
  PAUSES: 'signaling:ws:pauses',
  PRODUCE_ON : "signaling:ws:produce_on",
  PRODUCE_OFF: 'signaling:ws:produce_off', // 비디오 or 마이크 off
  SCREEN_STOP: 'signaling:ws:screen_stop', // 화면 공유 stop -> 추가적으로
  UPLOAD_FILE: 'signaling:ws:upload_file', // 파일을 전송하는 이벤트
  FILE_CHECK: 'signaling:ws:file_check', // 파일이 제대로 올라갔는지 확인하는 이벤트
  FILE_DOWNLOAD: 'signaling:ws:file_download', // 파일을 다운로드 하는 이벤트
  SEND_MESSAGE: 'signaling:ws:send_message', // 메시지를 보내는 이벤트

  // 워크 스페이스 or 코드에디터 생성을 위한 이벤트 이름
  OPEN_WHITEBOARD: 'signaling:ws:open_whiteboard',
  OPEN_CODEEDITOR: 'signaling:ws:open_codeeditor',
  CONNECT_TOOL: 'signaling:ws:connect_tool',
  DISCONNECT_TOOL: 'signaling:ws:disconnect_tool',
} as const);

export const WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME = Object.freeze({
  JOINED: 'room:joined',
  ADMISSION: 'room:admission',
  ALERT_PRODUCED: 'room:alert_produced', // produce 변경을 알린다.
  SCREEN_STOP: 'room:screen_stop',
  NEW_USER: 'room:new_user',
  USER_CLOSED: 'room:user_closed',
  RECV_MESSAGE: 'room:recv_message',
  ERROR: 'room:error',

  // 아래는 오게될 요청
  REQUEST_WHITEBOARD: 'room:request_whiteboard',
  REQUEST_CODEEDITOR: 'room:request_codeeditor',
} as const);
