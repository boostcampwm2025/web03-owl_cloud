import { MediaState, MeetingMemberInfo, MemberStream } from '@/types/meeting';
import { create } from 'zustand';

const INITIAL_MEDIA_STATE: MediaState = {
  videoOn: false,
  audioOn: false,
  screenShareOn: false,
  cameraPermission: 'unknown',
  micPermission: 'unknown',
};

interface MeetingState {
  media: MediaState;
  members: Record<string, MeetingMemberInfo>;
  memberStreams: Record<string, MemberStream>;
  hasNewChat: boolean;

  isInfoOpen: boolean;
  isMemberOpen: boolean;
  isChatOpen: boolean;
  isWorkspaceOpen: boolean;
  isCodeEditorOpen: boolean;
}

interface MeetingActions {
  setMedia: (media: Partial<MediaState>) => void;
  setMembers: (members: MeetingMemberInfo[]) => void;
  addMember: (member: MeetingMemberInfo) => void;
  removeMember: (userId: string) => void;

  setMemberStream: (userId: string, type: string, stream: MediaStream) => void;
  removeMemberStream: (userId: string, type: string) => void;

  setHasNewChat: (state: boolean) => void;

  setIsOpen: (
    type: keyof Pick<
      MeetingState,
      | 'isInfoOpen'
      | 'isMemberOpen'
      | 'isChatOpen'
      | 'isWorkspaceOpen'
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

  isInfoOpen: false,
  isMemberOpen: false,
  isChatOpen: false,
  isWorkspaceOpen: false,
  isCodeEditorOpen: false,

  setMedia: (media) => set((prev) => ({ media: { ...prev.media, ...media } })),
  setMembers: (members) =>
    set(() => {
      const newMembersMap = members.reduce(
        (acc, cur) => ({ ...acc, [cur.user_id]: cur }),
        {},
      );

      return {
        members: newMembersMap,
      };
    }),
  addMember: (member) =>
    set((state) => {
      const existingStream = state.memberStreams[member.user_id] || {};

      return {
        members: {
          ...state.members,
          [member.user_id]: member,
        },
        memberStreams: {
          ...state.memberStreams,
          [member.user_id]: existingStream,
        },
      };
    }),
  removeMember: (userId) =>
    set((state) => {
      const nextMembers = { ...state.members };
      delete nextMembers[userId];
      const nextMemberStreams = { ...state.memberStreams };
      delete nextMemberStreams[userId];
      return { members: nextMembers, memberStreams: nextMemberStreams };
    }),

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
