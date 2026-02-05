import { render, screen, fireEvent } from '@testing-library/react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import MemberListItem from '@/components/meeting/MemberListItem';

jest.mock('@/assets/icons/meeting', () => ({
  MicOnIcon: () => <div data-testid="mic-on" />,
  MicOffIcon: () => <div data-testid="mic-off" />,
  CamOnIcon: () => <div data-testid="cam-on" />,
  CamOffIcon: () => <div data-testid="cam-off" />,
}));

jest.mock('@/assets/icons/common', () => ({
  MoreVertIcon: () => <div data-testid="more-icon" />,
}));

jest.mock('@/components/common/ProfileImg', () => {
  const MockProfile = ({ nickname }: { nickname: string }) => (
    <div>Profile: {nickname}</div>
  );
  MockProfile.displayName = 'MockProfile';
  return MockProfile;
});

jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

describe('<MemberListItem />', () => {
  const defaultProps = {
    id: 'target-user-id',
    name: 'Test User',
    audio: true,
    video: true,
    profileImg: null,
  };

  // 각 테스트 전 스토어 상태 초기화
  beforeEach(() => {
    useMeetingStore.setState({
      pinnedMemberIds: [],
      togglePin: jest.fn(), // 호출 여부 감시를 위해 Mock 함수 할당
    });
    useUserStore.setState({
      userId: 'my-id',
    });
  });

  it('Props에 따라 참가자 이름과 마이크/캠 켜짐 아이콘이 정상적으로 렌더링된다', () => {
    render(<MemberListItem {...defaultProps} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByTestId('mic-on')).toBeInTheDocument();
    expect(screen.getByTestId('cam-on')).toBeInTheDocument();
  });

  it('audio, video가 false일 경우 꺼짐 아이콘이 렌더링된다', () => {
    render(<MemberListItem {...defaultProps} audio={false} video={false} />);

    expect(screen.getByTestId('mic-off')).toBeInTheDocument();
    expect(screen.getByTestId('cam-off')).toBeInTheDocument();
  });

  it('더보기 버튼을 클릭하면 드롭다운 메뉴가 열린다', () => {
    render(<MemberListItem {...defaultProps} />);

    // 초기에는 "고정" 버튼이 없어야 함 (드롭다운 닫힘 상태)
    expect(screen.queryByText('고정')).not.toBeInTheDocument();

    // 더보기 버튼 클릭
    fireEvent.click(screen.getByRole('button'));

    // 드롭다운 메뉴 등장 확인
    expect(screen.getByText('고정')).toBeInTheDocument();
  });

  it('현재 핀 고정되지 않은 유저의 드롭다운에는 "고정" 텍스트가 보인다', () => {
    useMeetingStore.setState({ pinnedMemberIds: [] });
    render(<MemberListItem {...defaultProps} />);

    // 드롭다운 열기
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('고정')).toBeInTheDocument();
  });

  it('이미 핀 고정된 유저의 드롭다운에는 "고정 해제" 텍스트가 보인다', () => {
    useMeetingStore.setState({ pinnedMemberIds: ['target-user-id'] });
    render(<MemberListItem {...defaultProps} />);

    // 드롭다운 열기
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('고정 해제')).toBeInTheDocument();
  });

  it('고정/해제 버튼을 클릭하면 togglePin 액션이 호출되고 드롭다운이 닫힌다', () => {
    // togglePin 감시를 위한 Spy 설정
    const togglePinSpy = jest.fn();
    useMeetingStore.setState({ togglePin: togglePinSpy });

    render(<MemberListItem {...defaultProps} />);

    // 1. 드롭다운 열기
    fireEvent.click(screen.getByRole('button'));

    // 2. 고정 버튼 클릭
    const pinButton = screen.getByText('고정');
    fireEvent.click(pinButton);

    // 3. 검증: togglePin 호출 및 드롭다운 닫힘
    expect(togglePinSpy).toHaveBeenCalledWith('target-user-id');
    expect(screen.queryByText('고정')).not.toBeInTheDocument();
  });

  it('자신(Me)의 항목인 경우, 더보기 버튼이 노출되지 않는다 (Interaction 불가)', () => {
    // Given: 로그인한 유저 ID와 컴포넌트 ID가 같음
    useUserStore.setState({ userId: 'my-id' });
    render(<MemberListItem {...defaultProps} id="my-id" />);

    // When: (Hover 상황을 시뮬레이션 하더라도)
    // 리액트 테스팅 라이브러리에서 CSS group-hover를 완벽히 재현하긴 어렵지만,
    // 로직상 'group-hover:flex' 클래스가 적용되지 않았는지 확인하거나
    // 해당 버튼이 hidden 상태인지 간접적으로 확인할 수 있습니다.

    // 여기서는 버튼 자체가 렌더링은 되지만 CSS로 숨겨져 있는 상태입니다.
    // tailwind 클래스 로직 검증: userId === id이면 'group-hover:flex'가 없어야 함

    const moreButtonContainer = screen.getByRole('button').parentElement;

    // 'group-hover:flex' 클래스가 포함되지 않았음을 검증
    expect(moreButtonContainer).not.toHaveClass('group-hover:flex');
  });

  it('프로필 이미지가 없는(null) 경우에도 에러 없이 닉네임이 표시된다', () => {
    // Given: profileImg가 null
    render(<MemberListItem {...defaultProps} profileImg={null} />);

    // Then: 닉네임이 정상적으로 나오는지 확인 (ProfileImg 컴포넌트 내부 로직이지만 통합 관점에서 확인)
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
