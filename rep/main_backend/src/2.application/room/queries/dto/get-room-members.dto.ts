


export type GetRoomMembersDto = {
  room_id : string;
};

type MemberProviderInfo = {
  provider_id : string;
  kind: "audio" | "video";
  type : "mic" | "cam";
};

type ProviderInfo = {
  user_id : string;
  nickname : string;
  provider_id : string;
  kind: "audio" | "video";
  type : "mic" | "cam" | "screen_video" | "screen_audio";
} 

type GetRoomMainInfo = {
  main : ProviderInfo | null;
  sub : ProviderInfo | null;
};

type MembersInfo = {
  user_id : string;
  nickname : string;
  profile_path : string | null;
  cam : MemberProviderInfo | null;
  mic : MemberProviderInfo | null
};

export type GetRoomMembersResult = {
  main : GetRoomMainInfo | null;

  members : Array<MembersInfo>
};