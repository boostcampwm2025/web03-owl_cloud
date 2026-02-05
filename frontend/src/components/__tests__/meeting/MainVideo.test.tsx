import { render, screen } from '@testing-library/react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { MeetingMemberInfo } from '@/types/meeting';
import MainVideo from '@/components/meeting/MainVideo';

jest.mock('@/components/meeting/MyVideo', () => {
  const MockMyVideo = () => (
    <div data-testid="my-video">My Video Component</div>
  );
  MockMyVideo.displayName = 'MockMyVideo';
  return MockMyVideo;
});

jest.mock('@/components/meeting/MemberVideo', () => {
  const MockMemberVideo = (props: MeetingMemberInfo) => (
    <div data-testid="member-video">Member: {props.nickname}</div>
  );
  MockMemberVideo.displayName = 'MockMemberVideo';
  return MockMemberVideo;
});

const createMember = (id: string, nickname: string): MeetingMemberInfo => ({
  user_id: id,
  nickname,
  profile_path: null,
  is_guest: false,
  cam: null,
  mic: null,
});

describe('<MainVideo />', () => {
  beforeEach(() => {
    useMeetingStore.setState({
      pinnedMemberIds: [],
      orderedMemberIds: [],
      members: {},
      lastSpeakerId: null,
    });
  });

  it('1순위: 핀 고정된 멤버가 있고 데이터가 유효하면 그를 보여준다', () => {
    // Given
    const userA = createMember('user-A', 'Pinned User');
    const userB = createMember('user-B', 'Speaker User');

    useMeetingStore.setState({
      pinnedMemberIds: ['user-A'],
      lastSpeakerId: 'user-B',
      orderedMemberIds: ['user-A', 'user-B'],
      members: { 'user-A': userA, 'user-B': userB },
    });

    // When
    render(<MainVideo />);

    // Then
    expect(screen.getByText('Member: Pinned User')).toBeInTheDocument();
  });

  it('2순위: 핀 고정이 없고, 최근 발언자가 있으면 그를 보여준다', () => {
    // Given
    const userB = createMember('user-B', 'Speaker User');
    const userC = createMember('user-C', 'Normal User');

    useMeetingStore.setState({
      pinnedMemberIds: [], // 핀 없음
      lastSpeakerId: 'user-B',
      orderedMemberIds: ['user-C', 'user-B'],
      members: { 'user-B': userB, 'user-C': userC },
    });

    // When
    render(<MainVideo />);

    // Then
    expect(screen.getByText('Member: Speaker User')).toBeInTheDocument();
  });

  it('3순위: 핀/발언자가 없으면 목록의 첫 번째 멤버를 보여준다', () => {
    // Given
    const userC = createMember('user-C', 'First Member');

    useMeetingStore.setState({
      pinnedMemberIds: [],
      lastSpeakerId: null,
      orderedMemberIds: ['user-C'],
      members: { 'user-C': userC },
    });

    // When
    render(<MainVideo />);

    // Then
    expect(screen.getByText('Member: First Member')).toBeInTheDocument();
  });

  it('예외: 모든 조건이 없으면 MyVideo를 보여준다', () => {
    // Given
    useMeetingStore.setState({
      pinnedMemberIds: [],
      lastSpeakerId: null,
      orderedMemberIds: [],
      members: {},
    });

    // When
    render(<MainVideo />);

    // Then
    expect(screen.getByTestId('my-video')).toBeInTheDocument();
  });

  it('Edge Case: 핀 고정 ID가 존재하지만 실제 멤버 데이터가 없는 경우(퇴장 등), 다음 순위(발언자)로 넘어간다', () => {
    // Given
    const userB = createMember('user-B', 'Speaker User');

    useMeetingStore.setState({
      pinnedMemberIds: ['ghost-user'], // 이미 나간 유저의 ID가 핀 목록에 남아있다고 가정
      lastSpeakerId: 'user-B',
      orderedMemberIds: ['user-B'],
      members: { 'user-B': userB }, // ghost-user 정보는 없음
    });

    // When
    render(<MainVideo />);

    // Then
    // 1순위(ghost-user)가 데이터 검증 실패 -> 2순위(Speaker User)가 나와야 함
    expect(screen.getByText('Member: Speaker User')).toBeInTheDocument();
  });
});
