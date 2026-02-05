import { render, screen, fireEvent } from '@testing-library/react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { MeetingMemberInfo } from '@/types/meeting';
import { getMembersPerPage } from '@/utils/meeting';
import { useWindowSize } from '@/hooks/useWindowSize';
import MemberVideoBar from '@/components/meeting/MemberVideoBar';

jest.mock('@/utils/meeting', () => ({
  getMembersPerPage: jest.fn(),
  getVideoConsumerIds: jest.fn(() => ({
    newVideoConsumers: [],
    resumeConsumerIds: [],
    pauseConsumerIds: [],
    visibleStreamTracks: [],
    hiddenUserIds: [],
  })),
  getConsumerInstances: jest.fn(),
  reorderMembers: jest.fn(),
}));

jest.mock('@/hooks/useWindowSize', () => ({
  useWindowSize: jest.fn(),
}));

jest.mock('@/components/meeting/MyVideo', () => {
  const MockMyVideo = () => <div data-testid="my-video">My Video</div>;
  MockMyVideo.displayName = 'MockMyVideo';
  return MockMyVideo;
});

jest.mock('@/components/meeting/MemberVideo', () => {
  const MockMemberVideo = ({ nickname }: { nickname: string }) => (
    <div data-testid="member-video">{nickname}</div>
  );
  MockMemberVideo.displayName = 'MockMemberVideo';
  return MockMemberVideo;
});

jest.mock('@/assets/icons/common', () => ({
  ChevronLeftIcon: () => <div>Prev</div>,
  ChevronRightIcon: () => <div>Next</div>,
}));

// Helper
const createMember = (idx: number): MeetingMemberInfo => ({
  user_id: `user-${idx}`,
  nickname: `Member ${idx}`,
  profile_path: null,
  is_guest: false,
  cam: null,
  mic: null,
});

describe('<MemberVideoBar />', () => {
  beforeEach(() => {
    // 소켓 로직 실행 방지
    useMeetingSocketStore.setState({
      socket: null,
      recvTransport: null,
      device: null,
      consumers: {},
    });

    useMeetingStore.setState({ members: {}, orderedMemberIds: [] });

    // 데스크탑 기준 설정: width 1400 -> 페이지당 6명 표시
    (useWindowSize as jest.Mock).mockReturnValue({ width: 1400 });
    (getMembersPerPage as jest.Mock).mockReturnValue(6);
  });

  it('1페이지(6슬롯)에서는 MyVideo가 보이고, 나머지 5칸에 멤버들이 표시된다', () => {
    // Given: 멤버 10명
    const members: Record<string, MeetingMemberInfo> = {};
    const orderedIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const m = createMember(i);
      members[m.user_id] = m;
      orderedIds.push(m.user_id);
    }
    useMeetingStore.setState({ members, orderedMemberIds: orderedIds });

    render(<MemberVideoBar />);

    // Then
    expect(screen.getByTestId('my-video')).toBeInTheDocument();

    // 1페이지 멤버: 총 6슬롯 - MyVideo(1) = 5명
    const memberVideos = screen.getAllByTestId('member-video');
    expect(memberVideos).toHaveLength(5);

    expect(memberVideos[0]).toHaveTextContent('Member 1');
    expect(memberVideos[4]).toHaveTextContent('Member 5');
  });

  it('다음 버튼을 누르면 2페이지로 이동하고 MyVideo 없이 6명의 멤버가 표시된다', () => {
    // Given: 멤버 12명 (1페이지 5명 + 2페이지 6명 + 3페이지 1명)
    const members: Record<string, MeetingMemberInfo> = {};
    const orderedIds: string[] = [];
    for (let i = 1; i <= 12; i++) {
      const m = createMember(i);
      members[m.user_id] = m;
      orderedIds.push(m.user_id);
    }
    useMeetingStore.setState({ members, orderedMemberIds: orderedIds });

    render(<MemberVideoBar />);

    // When: 다음 페이지 이동
    const nextBtn = screen.getByText('Next').closest('button');
    fireEvent.click(nextBtn!);

    // Then
    expect(screen.queryByTestId('my-video')).not.toBeInTheDocument();

    // 2페이지 멤버: 6슬롯 전체 사용
    const memberVideos = screen.getAllByTestId('member-video');
    expect(memberVideos).toHaveLength(6);

    // Member 6 ~ Member 11 확인
    expect(memberVideos[0]).toHaveTextContent('Member 6');
    expect(memberVideos[5]).toHaveTextContent('Member 11');
  });

  it('멤버 수가 페이지 용량(1페이지) 이하이면 이동 버튼이 비활성화된다', () => {
    // Given: 멤버 5명 (MyVideo 포함 6슬롯을 넘지 않음)
    const members: Record<string, MeetingMemberInfo> = {};
    const orderedIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const m = createMember(i);
      members[m.user_id] = m;
      orderedIds.push(m.user_id);
    }
    useMeetingStore.setState({ members, orderedMemberIds: orderedIds });

    render(<MemberVideoBar />);

    const nextBtn = screen.getByText('Next').closest('button');
    expect(nextBtn).toHaveClass('cursor-default!');
  });
});
