import { render, screen, fireEvent } from '@testing-library/react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { MeetingMemberInfo } from '@/types/meeting';
import MemberVideo from '@/components/meeting/MemberVideo';

// VideoView Mock: stream이 잘 넘어왔는지 확인하기 위해 data-prop 사용
jest.mock('@/components/meeting/media/VideoView', () => {
  const MockVideoView = ({ stream }: { stream: MediaStream }) => (
    <div data-testid="video-view" data-stream-id={stream.id}>
      Video Playing
    </div>
  );
  MockVideoView.displayName = 'MockVideoView';
  return MockVideoView;
});

// ProfileImg Mock
jest.mock('@/components/common/ProfileImg', () => {
  const MockProfileImg = ({ nickname }: { nickname: string }) => (
    <div data-testid="profile-img">{nickname} Profile</div>
  );
  MockProfileImg.displayName = 'MockProfileImg';
  return MockProfileImg;
});

// Icons Mock
jest.mock('@/assets/icons/common', () => ({
  MoreHoriIcon: () => <div data-testid="more-icon" />,
}));
jest.mock('@/assets/icons/meeting', () => ({
  MicOffIcon: () => <div data-testid="mic-off-icon" />,
  PinIcon: () => <div data-testid="pin-icon" />,
}));

// useClickOutside Mock: 테스트 환경에서 복잡한 이벤트 리스너 로직 방지
jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

const targetUser: MeetingMemberInfo = {
  user_id: 'target-user',
  nickname: 'Target User',
  profile_path: 'path/to/profile.jpg',
  is_guest: false,
  cam: null,
  mic: null,
};

describe('<MemberVideo />', () => {
  beforeEach(() => {
    // 스토어 상태 초기화
    useMeetingStore.setState({
      pinnedMemberIds: [],
      memberStreams: {},
      speakingMembers: {},
      togglePin: jest.fn(),
    });
  });

  it('카메라 스트림(cam)이 있으면 VideoView를 렌더링한다', () => {
    // Given: cam 스트림 존재
    const mockStream = { id: 'cam-stream-1' } as unknown as MediaStream;
    useMeetingStore.setState({
      memberStreams: {
        'target-user': { cam: mockStream, mic: undefined },
      },
    });

    // When
    render(<MemberVideo {...targetUser} />);

    // Then
    const videoView = screen.getByTestId('video-view');
    expect(videoView).toBeInTheDocument();
    expect(videoView).toHaveAttribute('data-stream-id', 'cam-stream-1');

    // ProfileImg는 없어야 함
    expect(screen.queryByTestId('profile-img')).not.toBeInTheDocument();
  });

  it('카메라 스트림이 없으면 ProfileImg를 렌더링한다', () => {
    // Given: cam 스트림 없음 (undefined)
    useMeetingStore.setState({
      memberStreams: {
        'target-user': { cam: undefined, mic: undefined },
      },
    });

    // When
    render(<MemberVideo {...targetUser} />);

    // Then
    expect(screen.getByTestId('profile-img')).toBeInTheDocument();
    expect(screen.queryByTestId('video-view')).not.toBeInTheDocument();
  });

  it('발언 중(isSpeaking)일 때 파란색 테두리(border-sky-500)가 표시된다', () => {
    // Given
    useMeetingStore.setState({
      speakingMembers: { 'target-user': true },
    });

    // When
    render(<MemberVideo {...targetUser} />);

    // Then
    // 테두리 div 찾기 (pointer-events-none 클래스를 가진 요소)
    // 혹은 container div가 border를 가지는지 확인해야 하는데,
    // 현재 코드는 "absolute inset-0 ... border-sky-500" div가 조건부 렌더링됨.

    // 방법 1: 클래스로 찾기 (Testing Library 권장 방식은 아니지만 스타일 검증시 유용)
    const borderDiv = document.querySelector('.border-sky-500');
    expect(borderDiv).toBeInTheDocument();
  });

  it('핀 고정된 상태면 핀 아이콘이 보이고, 드롭다운 메뉴가 "고정 해제"로 표시된다', () => {
    // Given
    useMeetingStore.setState({
      pinnedMemberIds: ['target-user'],
    });

    // When
    render(<MemberVideo {...targetUser} />);

    // Then 1: 이름표 옆 핀 아이콘 확인
    expect(screen.getByTestId('pin-icon')).toBeInTheDocument();

    // Then 2: 드롭다운 열어서 텍스트 확인
    fireEvent.click(screen.getByRole('button')); // 더보기 버튼 클릭
    expect(screen.getByText('고정 해제')).toBeInTheDocument();
  });

  it('마이크 스트림이 없으면(mic off) 마이크 꺼짐 아이콘이 표시된다', () => {
    // Given: mic 스트림 없음
    useMeetingStore.setState({
      memberStreams: {
        'target-user': { mic: undefined },
      },
    });

    // When
    render(<MemberVideo {...targetUser} />);

    // Then
    expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument();
  });

  it('마이크 스트림이 있으면(mic on) 마이크 꺼짐 아이콘이 사라진다', () => {
    // Given: mic 스트림 존재
    const mockMicStream = {} as unknown as MediaStream;
    useMeetingStore.setState({
      memberStreams: {
        'target-user': { mic: mockMicStream },
      },
    });

    // When
    render(<MemberVideo {...targetUser} />);

    // Then
    expect(screen.queryByTestId('mic-off-icon')).not.toBeInTheDocument();
  });

  it('드롭다운에서 핀 고정 버튼을 누르면 togglePin이 호출된다', () => {
    // Given
    const togglePinSpy = jest.fn();
    useMeetingStore.setState({
      pinnedMemberIds: [], // 현재 고정 안 된 상태
      togglePin: togglePinSpy,
    });

    render(<MemberVideo {...targetUser} />);

    // When
    fireEvent.click(screen.getByRole('button')); // 1. 메뉴 열기
    fireEvent.click(screen.getByText('고정')); // 2. 고정 버튼 클릭

    // Then
    expect(togglePinSpy).toHaveBeenCalledWith('target-user');
  });
});
