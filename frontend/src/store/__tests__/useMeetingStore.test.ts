import { act } from '@testing-library/react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { MeetingMemberInfo } from '@/types/meeting';

const createMember = (
  overrides: Partial<MeetingMemberInfo> = {},
): MeetingMemberInfo => ({
  user_id: 'user1',
  nickname: '유저1',
  profile_path: null,
  is_guest: true,
  cam: null,
  mic: null,
  ...overrides,
});

describe('useMeetingStore', () => {
  beforeEach(() => {
    const { setState } = useMeetingStore;
    act(() => {
      setState({
        media: {
          videoOn: false,
          audioOn: false,
          screenShareOn: false,
          cameraPermission: 'unknown',
          micPermission: 'unknown',
          speakerId: '',
          micId: '',
          cameraId: '',
        },
        members: {},
        memberStreams: {},
        hasNewChat: false,
        screenSharer: null,
        speakingMembers: {},
        orderedMemberIds: [],
        pinnedMemberIds: [],
        meetingInfo: {
          title: '',
          host_nickname: '',
          current_participants: 0,
          max_participants: 0,
          has_password: false,
          meetingId: '',
        },
        lastSpeakerId: null,
        isInfoOpen: false,
        isMemberOpen: false,
        isChatOpen: false,
        isWhiteboardOpen: false,
        isCodeEditorOpen: false,
        isCodeEditorOpening: false,
        isInfoLoaded: false,
      });
    });
  });

  it('setMedia는 기존 media를 유지하면서 일부 값만 갱신한다', () => {
    const { setMedia } = useMeetingStore.getState();

    act(() => {
      setMedia({ videoOn: true });
    });

    const { media } = useMeetingStore.getState();

    expect(media.videoOn).toBe(true);
    expect(media.audioOn).toBe(false); // 기존 값 유지
  });

  it('setMeetingInfo는 meetingInfo를 병합하고 isInfoLoaded를 true로 만든다', () => {
    const { setMeetingInfo } = useMeetingStore.getState();

    act(() => {
      setMeetingInfo({
        title: '테스트 회의',
        meetingId: 'abc123',
      });
    });

    const { meetingInfo, isInfoLoaded } = useMeetingStore.getState();

    expect(meetingInfo.title).toBe('테스트 회의');
    expect(meetingInfo.meetingId).toBe('abc123');
    expect(isInfoLoaded).toBe(true);
  });

  it('setHasNewChat은 채팅 알림 상태를 토글한다', () => {
    const { setHasNewChat } = useMeetingStore.getState();

    act(() => {
      setHasNewChat(true);
    });

    expect(useMeetingStore.getState().hasNewChat).toBe(true);

    act(() => {
      setHasNewChat(false);
    });

    expect(useMeetingStore.getState().hasNewChat).toBe(false);
  });

  it('addMember는 멤버를 추가하고 orderedMemberIds에 반영한다', () => {
    const { addMember } = useMeetingStore.getState();

    act(() => {
      addMember(createMember());
    });

    const state = useMeetingStore.getState();

    expect(state.members['user1']).toBeDefined();
    expect(state.orderedMemberIds).toEqual(['user1']);
  });

  it('removeMember는 멤버와 관련된 상태를 정리한다', () => {
    const { addMember, removeMember } = useMeetingStore.getState();

    act(() => {
      addMember(createMember());
      removeMember('user1');
    });

    const state = useMeetingStore.getState();

    expect(state.members['user1']).toBeUndefined();
    expect(state.orderedMemberIds).not.toContain('user1');
  });

  it('togglePin은 멤버를 고정/해제하고 순서를 재정렬한다', () => {
    const { addMember, togglePin } = useMeetingStore.getState();
    const [aMember, bMember] = [
      createMember({ user_id: 'a', nickname: 'A' }),
      createMember({ user_id: 'b', nickname: 'B' }),
    ];

    act(() => {
      addMember(aMember);
      addMember(bMember);
      togglePin('b');
    });

    const state = useMeetingStore.getState();

    expect(state.pinnedMemberIds).toEqual(['b']);
    expect(state.orderedMemberIds[0]).toBe('b');
  });

  it('setSpeaking(true)는 마지막 발화자를 갱신한다', () => {
    const { addMember, setSpeaking } = useMeetingStore.getState();

    act(() => {
      addMember(createMember());
      setSpeaking('user1', true);
    });

    const state = useMeetingStore.getState();

    expect(state.speakingMembers['user1']).toBe(true);
    expect(state.lastSpeakerId).toBe('user1');
  });
});
