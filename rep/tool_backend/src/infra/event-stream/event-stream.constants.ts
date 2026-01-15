
export const KAFKA = Symbol("KAFKA");

export const EVENT_STREAM_NAME = Object.freeze({
  CODEEDITOR_ENTER : "codeeditor.enter",
  WHITEBOARD_ENTER : "whiteboard.enter"
} as const);