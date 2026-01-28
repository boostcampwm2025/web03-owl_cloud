import {
  MediaState,
  MediaType,
  MeetingInfoResponse,
  MeetingMemberInfo,
  MemberStream,
} from '@/types/meeting';
import { create } from 'zustand';

const INITIAL_MEDIA_STATE: MediaState = {
  videoOn: false,
  audioOn: false,
  screenShareOn: false,
  cameraPermission: 'unknown',
  micPermission: 'unknown',
};

const INITIAL_MEETING_INFO: MeetingInfo = {
  title: '',
  host_nickname: '',
  current_participants: 0,
  max_participants: 0,
  has_password: false,
  meetingId: '',
};

const VISIBLE_COUNT = 5;

type MeetingInfo = MeetingInfoResponse & {
  meetingId: string;
  isHosted?: boolean;
};

interface MeetingState {
  media: MediaState;
  members: Record<string, MeetingMemberInfo>;
  memberStreams: Record<string, MemberStream>;
  hasNewChat: boolean;
  screenSharer: { id: string; nickname: string } | null;
  speakingMembers: Record<string, boolean>;
  orderedMemberIds: string[];
  pinnedMemberIds: string[];
  meetingInfo: MeetingInfo;
  lastSpeakerId: string | null;

  isInfoOpen: boolean;
  isMemberOpen: boolean;
  isChatOpen: boolean;
  isWhiteboardOpen: boolean;
  isCodeEditorOpen: boolean;
  isInfoLoaded: boolean;
}

interface MeetingActions {
  setMedia: (media: Partial<MediaState>) => void;
  setMembers: (members: MeetingMemberInfo[]) => void;
  addMember: (member: MeetingMemberInfo) => void;
  removeMember: (userId: string) => void;
  setScreenSharer: (sharer: { id: string; nickname: string } | null) => void;
  setSpeaking: (userId: string, isSpeaking: boolean) => void;
  togglePin: (userId: string) => void;
  setMeetingInfo: (info: Partial<MeetingInfo>) => void;

  setMemberStream: (
    userId: string,
    type: MediaType,
    stream: MediaStream,
  ) => void;
  removeMemberStream: (userId: string, type: MediaType) => void;

  setHasNewChat: (state: boolean) => void;

  setIsOpen: (
    type: keyof Pick<
      MeetingState,
      | 'isInfoOpen'
      | 'isMemberOpen'
      | 'isChatOpen'
      | 'isWhiteboardOpen'
      | 'isCodeEditorOpen'
    >,
    state: boolean,
  ) => void;
}

export const useMeetingStore = create<MeetingState & MeetingActions>((set) => ({
  media: INITIAL_MEDIA_STATE,
  members: {},
  memberStreams: {},
  hasNewChat: false,
  screenSharer: null,
  speakingMembers: {},
  orderedMemberIds: [],
  pinnedMemberIds: [],
  meetingInfo: INITIAL_MEETING_INFO,
  lastSpeakerId: null,

  isInfoOpen: false,
  isMemberOpen: false,
  isChatOpen: false,
  isWhiteboardOpen: false,
  isCodeEditorOpen: false,
  isInfoLoaded: false,

  setMedia: (media) => set((prev) => ({ media: { ...prev.media, ...media } })),
  setMembers: (members) =>
    set(() => {
      const newMembersMap = members.reduce(
        (acc, cur) => ({ ...acc, [cur.user_id]: cur }),
        {},
      );
      const newOrderedIds = members.map((m) => m.user_id);

      return {
        members: newMembersMap,
        orderedMemberIds: newOrderedIds,
      };
    }),
  addMember: (member) =>
    set((state) => {
      const userId = member.user_id;
      const existingStream = state.memberStreams[member.user_id] || {};

      if (state.orderedMemberIds.includes(userId)) {
        return {
          members: { ...state.members, [userId]: member },
        };
      }

      const remainingIds = state.orderedMemberIds.filter(
        (id) => !state.pinnedMemberIds.includes(id) && id !== userId,
      );

      const nextOrderedIds = [
        ...state.pinnedMemberIds,
        userId,
        ...remainingIds,
      ];

      return {
        members: {
          ...state.members,
          [userId]: member,
        },
        memberStreams: {
          ...state.memberStreams,
          [userId]: existingStream,
        },
        orderedMemberIds: nextOrderedIds,
      };
    }),
  removeMember: (userId) =>
    set((state) => {
      const nextMembers = { ...state.members };
      delete nextMembers[userId];
      const nextMemberStreams = { ...state.memberStreams };
      delete nextMemberStreams[userId];
      const nextSpeakingMembers = { ...state.speakingMembers };
      delete nextSpeakingMembers[userId];

      return {
        members: nextMembers,
        memberStreams: nextMemberStreams,
        speakingMembers: nextSpeakingMembers,
        orderedMemberIds: state.orderedMemberIds.filter((id) => id !== userId),
        pinnedMemberIds: state.pinnedMemberIds.filter((id) => id !== userId),
        lastSpeakerId:
          state.lastSpeakerId === userId ? null : state.lastSpeakerId,
      };
    }),
  setScreenSharer: (sharer) => set(() => ({ screenSharer: sharer })),
  setSpeaking: (userId, isSpeaking) =>
    set((state) => {
      const lastSpeakerUpdate = isSpeaking ? { lastSpeakerId: userId } : {};

      // 말하기를 멈췄을 때나, 고정된 유저는 계산에서 제외
      if (!isSpeaking && state.pinnedMemberIds.includes(userId)) {
        return {
          speakingMembers: { ...state.speakingMembers, [userId]: isSpeaking },
        };
      }

      const currentIndex = state.orderedMemberIds.indexOf(userId);
      let nextOrderedIds = state.orderedMemberIds;

      // 발언한 사람이 첫 페이지에 존재하는지 확인
      if (isSpeaking && currentIndex > VISIBLE_COUNT - 1) {
        const otherIds = state.orderedMemberIds.filter(
          (id) => !state.pinnedMemberIds.includes(id) && id !== userId,
        );
        nextOrderedIds = [...state.pinnedMemberIds, userId, ...otherIds];
      }

      return {
        speakingMembers: { ...state.speakingMembers, [userId]: isSpeaking },
        orderedMemberIds: nextOrderedIds,
        ...lastSpeakerUpdate,
      };
    }),
  togglePin: (userId) =>
    set((state) => {
      const isPinned = state.pinnedMemberIds.includes(userId);
      const nextPinned = isPinned
        ? state.pinnedMemberIds.filter((id) => id !== userId)
        : [...state.pinnedMemberIds, userId];
      const remainingIds = state.orderedMemberIds.filter(
        (id) => !nextPinned.includes(id),
      );

      return {
        pinnedMemberIds: nextPinned,
        orderedMemberIds: [...nextPinned, ...remainingIds],
      };
    }),
  setMeetingInfo: (info) =>
    set((state) => ({
      meetingInfo: {
        ...state.meetingInfo,
        ...info,
      },
      isInfoLoaded: true,
    })),
  setMemberStream: (userId, type, stream) =>
    set((state) => ({
      memberStreams: {
        ...state.memberStreams,
        [userId]: {
          ...state.memberStreams[userId],
          [type]: stream,
        },
      },
    })),
  removeMemberStream: (userId, type) =>
    set((state) => ({
      memberStreams: {
        ...state.memberStreams,
        [userId]: {
          ...state.memberStreams[userId],
          [type]: undefined,
        },
      },
    })),

  setHasNewChat: (state) => set({ hasNewChat: state }),
  setIsOpen: (type, state) => set({ [type]: state }),
}));
