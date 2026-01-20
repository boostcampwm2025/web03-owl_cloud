import { MediaState } from '@/types/media';
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

  members: number;
  hasNewChat: boolean;

  isInfoOpen: boolean;
  isMemberOpen: boolean;
  isChatOpen: boolean;
  isWorkspaceOpen: boolean;
  isCodeEditorOpen: boolean;
}

interface MeetingActions {
  setMedia: (media: Partial<MediaState>) => void;
  setMembers: (count: number) => void;
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

  members: 0,
  hasNewChat: false,

  isInfoOpen: false,
  isMemberOpen: false,
  isChatOpen: false,
  isWorkspaceOpen: false,
  isCodeEditorOpen: false,

  setMedia: (media) => set((prev) => ({ media: { ...prev.media, ...media } })),
  setMembers: (count) => set({ members: count }),
  setHasNewChat: (state) => set({ hasNewChat: state }),

  setIsOpen: (type, state) => set({ [type]: state }),
}));
