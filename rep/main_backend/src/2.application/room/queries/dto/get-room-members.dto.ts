export type GetRoomMembersDto = {
  room_id: string;
};

type MemberProviderInfo = {
  provider_id: string;
  kind: 'audio' | 'video';
  type: 'mic' | 'cam';
  is_paused: boolean;
};

export type ProviderInfo = {
  user_id: string;
  nickname: string;
  provider_id: string;
  kind: 'audio' | 'video';
  type: 'mic' | 'cam' | 'screen_video' | 'screen_audio';
};

export type ProviderToolInfo = {
  user_id: string;
  tool: 'whiteboard' | 'codeeditor';
};

export type GetRoomMainInfo = {
  main: ProviderInfo | ProviderToolInfo | null;
  sub: ProviderInfo | ProviderToolInfo | null;
};

export type MembersInfo = {
  user_id: string;
  nickname: string;
  profile_path: string | null;
  is_guest: boolean;
  cam: MemberProviderInfo | null;
  mic: MemberProviderInfo | null;
};

export type GetRoomMembersResult = {
  main: GetRoomMainInfo | null;

  members: Array<MembersInfo>;
};
