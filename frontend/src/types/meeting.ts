import { Device, Producer, Transport } from 'mediasoup-client/types';

export type MediaPermission = 'unknown' | 'granted' | 'denied';

export interface MediaState {
  videoOn: boolean;
  audioOn: boolean;
  screenShareOn: boolean;
  cameraPermission: MediaPermission;
  micPermission: MediaPermission;
}
export interface Producers {
  audioProducer: Producer | null;
  videoProducer: Producer | null;
  screenAudioProducer: Producer | null;
  screenVideoProducer: Producer | null;
}

export interface MediasoupTransports {
  device: Device;
  sendTransport: Transport;
  recvTransport: Transport;
}

export interface IsProducing {
  audio: boolean;
  video: boolean;
  screen: boolean;
}

interface ProviderInfo {
  user_id: string;
  nickname: string;
  provider_id: string;
  kind: 'audio' | 'video';
  type: 'mic' | 'cam' | 'screen_video' | 'screen_audio';
}

interface ProviderToolInfo {
  user_id: string;
  tool: 'whiteboard' | 'codeeditor';
}

// 회의 멤버 관련 타입
interface MemberProviderInfo {
  provider_id: string;
  kind: 'audio' | 'video';
  type: 'mic' | 'cam';
  is_paused: boolean;
}

export interface MeetingMember {
  user_id: string;
  nickname: string;
  profile_path: string | null;
  is_guest: boolean;
  cam: MemberProviderInfo | null;
  mic: MemberProviderInfo | null;
}

export interface FetchRoomMembersResponse {
  main: {
    main: ProviderInfo | ProviderToolInfo | null;
    sub: ProviderInfo | ProviderToolInfo | null;
  } | null;
  members: MeetingMember[];
}
