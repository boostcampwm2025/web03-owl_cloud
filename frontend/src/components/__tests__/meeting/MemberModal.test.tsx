import { render, screen, fireEvent } from '@testing-library/react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import MemberModal from '@/components/meeting/MemberModal';
import { MemberListItemProps } from '@/types/meeting';

// MemberListItem이 올바른 Props를 받았는지 확인하기 위해
// 전달받은 Props를 data-attribute로 렌더링하는 Mock 컴포넌트를 만듭니다.
jest.mock('@/components/meeting/MemberListItem', () => {
  const MockItem = (props: MemberListItemProps) => (
    <div
      data-testid="member-item"
      data-name={props.name}
      data-audio={props.audio ? 'on' : 'off'}
      data-video={props.video ? 'on' : 'off'}
      data-reversed={props.reverseDropdown ? 'true' : 'false'}
    >
      {props.name}
    </div>
  );
  MockItem.displayName = 'MockMemberListItem';
  return MockItem;
});

jest.mock('@/assets/icons/common', () => ({
  CloseIcon: () => <div data-testid="close-icon" />,
}));

describe('<MemberModal />', () => {
  beforeEach(() => {
    // 스토어 초기화
    useUserStore.setState({
      userId: 'me-id',
      nickname: 'My Name',
      profilePath: 'my-profile.jpg',
    });

    useMeetingStore.setState({
      media: {
        audioOn: false,
        videoOn: false,
        screenShareOn: false,
        cameraPermission: 'granted',
        micPermission: 'granted',
        speakerId: '',
        micId: '',
        cameraId: '',
      },
      members: {},
      memberStreams: {},
      setIsOpen: jest.fn(),
    });
  });

  it('나(Me)와 다른 참가자들을 합쳐서 목록에 표시하고, 전체 인원수를 보여준다', () => {
    // Given: 나(1명) + 다른 멤버(2명)
    useMeetingStore.setState({
      members: {
        'user-1': {
          user_id: 'user-1',
          nickname: 'User One',
          profile_path: null,
          is_guest: false,
          cam: null,
          mic: null,
        },
        'user-2': {
          user_id: 'user-2',
          nickname: 'User Two',
          profile_path: null,
          is_guest: false,
          cam: null,
          mic: null,
        },
      },
    });

    // When
    render(<MemberModal />);

    // Then
    // 1. 헤더의 인원수 확인 (나 + 2명 = 3명)
    expect(screen.getByText('참가자 (3)')).toBeInTheDocument();

    // 2. 리스트 아이템 개수 확인
    const items = screen.getAllByTestId('member-item');
    expect(items).toHaveLength(3);

    // 3. 첫 번째는 무조건 '나' 여야 함
    expect(items[0]).toHaveAttribute('data-name', 'My Name');
    expect(items[1]).toHaveAttribute('data-name', 'User One');
  });

  it('나(Index 0)의 오디오/비디오 상태는 media(로컬 상태) 값을 따른다', () => {
    // Given: 내 로컬 미디어는 켜져 있음
    useMeetingStore.setState({
      media: {
        audioOn: true, // True
        videoOn: false, // False
        screenShareOn: false,
        cameraPermission: 'granted',
        micPermission: 'granted',
        speakerId: '',
        micId: '',
        cameraId: '',
      },
      // stream 정보가 없어도 내 상태는 위의 값을 따라야 함
      memberStreams: {},
    });

    // When
    render(<MemberModal />);

    // Then
    const myItem = screen.getAllByTestId('member-item')[0];

    expect(myItem).toHaveAttribute('data-name', 'My Name');
    expect(myItem).toHaveAttribute('data-audio', 'on'); // audioOn: true
    expect(myItem).toHaveAttribute('data-video', 'off'); // videoOn: false
  });

  it('다른 참가자(Index > 0)의 오디오/비디오 상태는 memberStreams(스트림 존재 여부)를 따른다', () => {
    // Given: 다른 유저는 스트림 정보로 판단
    useMeetingStore.setState({
      members: {
        'user-1': {
          user_id: 'user-1',
          nickname: 'User One',
          profile_path: null,
          is_guest: false,
          cam: null,
          mic: null,
        },
      },
      memberStreams: {
        'user-1': {
          // as unknown as MediaStream을 사용하여
          // 실제 MediaStream 객체의 복잡한 메서드 구현 없이 존재 여부만 테스트
          mic: {} as unknown as MediaStream,
        },
      },
    });

    // When
    render(<MemberModal />);

    // Then
    const userItem = screen.getAllByTestId('member-item')[1]; // 0번은 나, 1번이 user-1

    expect(userItem).toHaveAttribute('data-name', 'User One');
    expect(userItem).toHaveAttribute('data-audio', 'on'); // mic stream 존재
    expect(userItem).toHaveAttribute('data-video', 'off'); // cam stream 없음
  });

  it('멤버가 많을 경우(>3), 목록 하단 멤버에게는 reverseDropdown=true가 전달된다', () => {
    // Given: 나(1) + 멤버(4) = 총 5명
    useMeetingStore.setState({
      members: {
        u1: {
          user_id: 'u1',
          nickname: 'User 1',
          profile_path: null,
          is_guest: false,
          cam: null,
          mic: null,
        },
        u2: {
          user_id: 'u2',
          nickname: 'User 2',
          profile_path: null,
          is_guest: false,
          cam: null,
          mic: null,
        },
        u3: {
          user_id: 'u3',
          nickname: 'User 3',
          profile_path: null,
          is_guest: false,
          cam: null,
          mic: null,
        },
        u4: {
          user_id: 'u4',
          nickname: 'User 4',
          profile_path: null,
          is_guest: false,
          cam: null,
          mic: null,
        },
      },
    });

    // When
    render(<MemberModal />);

    // Then
    const items = screen.getAllByTestId('member-item');
    expect(items).toHaveLength(5);

    // 로직: index >= members.length(4) - 2  => index >= 2 인 경우 reverse
    // items[0] (나) -> false
    // items[1] (u1) -> false
    // items[2] (u2) -> true (index 2)
    // items[3] (u3) -> true
    // items[4] (u4) -> true

    expect(items[0]).toHaveAttribute('data-reversed', 'false');
    expect(items[4]).toHaveAttribute('data-reversed', 'true');
  });

  it('닫기 버튼을 클릭하면 setIsOpen이 호출된다', () => {
    // Given
    const setIsOpenSpy = jest.fn();
    useMeetingStore.setState({ setIsOpen: setIsOpenSpy });

    render(<MemberModal />);

    // When
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);

    // Then
    expect(setIsOpenSpy).toHaveBeenCalledWith('isMemberOpen', false);
  });
});
