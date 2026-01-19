export const KAFKA = Symbol('KAFKA');

export const EVENT_STREAM_NAME = Object.freeze({
  CODEEDITOR_ENTER: 'codeeditor.enter',
  WHITEBOARD_ENTER: 'whiteboard.enter',
  TOOL_LEFT: 'tool.left', // tool을 닫는다.
} as const);

export type ToolEnterEvent = {
  room_id: string;
  user_id: string;
  tool: 'whiteboard' | 'codeeditor';
  socket_id: string;
  ticket: string;
  at: number;
};
