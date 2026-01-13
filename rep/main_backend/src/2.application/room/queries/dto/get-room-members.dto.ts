


export type GetRoomMembersDto = {
  room_id : string;
};

type MemberProviderInfo = {
  provider_id : string;
  kind: "audio" | "video";
  type : "mic" | "cam";
};

export type ProviderInfo = {
  user_id : string;
  nickname : string; 
  provider_id : string;
  kind: "audio" | "video";
  type : "mic" | "cam" | "screen_video" | "screen_audio";
} 

export type GetRoomMainInfo = {
  main : ProviderInfo | null;
  sub : ProviderInfo | null;
};

export type MembersInfo = {
  user_id : string;
  nickname : string;
  profile_path : string | null;
  is_guest : boolean;
  cam : MemberProviderInfo | null;
  mic : MemberProviderInfo | null
};

export type GetRoomMembersResult = {
  main : GetRoomMainInfo | null;

  members : Array<MembersInfo>
};