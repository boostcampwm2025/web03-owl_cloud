

export type AuthType = {
  token : string;
  type : "main" | "sub"
};

export type ToolBackendPayload = {
  user_id : string;
  room_id : string;
  tool : "whiteboard" | "codeeditor";
  clientType : "main" | "sub";
};