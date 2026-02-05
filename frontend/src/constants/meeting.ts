import { MediaState, MeetingInfo } from '@/types/meeting';

export const INITIAL_MEDIA_STATE: MediaState = {
  videoOn: false,
  audioOn: false,
  screenShareOn: false,
  cameraPermission: 'unknown',
  micPermission: 'unknown',
  speakerId: '',
  micId: '',
  cameraId: '',
};

export const INITIAL_MEETING_INFO: MeetingInfo = {
  title: '',
  host_nickname: '',
  current_participants: 0,
  max_participants: 0,
  has_password: false,
  meetingId: '',
};

export const VISIBLE_COUNT = 5;
