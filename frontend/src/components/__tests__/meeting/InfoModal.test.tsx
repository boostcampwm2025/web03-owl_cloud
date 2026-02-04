import { fireEvent, render, screen, act } from '@testing-library/react';
import InfoModal from '@/components/meeting/InfoModal';
import { useMeetingStore } from '@/store/useMeetingStore';
import { apiWithToken } from '@/utils/apiClient';

jest.mock('@/store/useMeetingStore');
jest.mock('@/utils/apiClient');

jest.mock('@/components/common/Modal', () => ({
  __esModule: true,
  default: ({
    children,
    title,
    cancelText,
    confirmText,
    onCancel,
    onConfirm,
  }: {
    children: React.ReactNode;
    title: string;
    cancelText?: string;
    confirmText?: string;
    onCancel?: () => void;
    onConfirm?: () => void;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
      {cancelText && <button onClick={onCancel}>{cancelText}</button>}
      {confirmText && <button onClick={onConfirm}>{confirmText}</button>}
    </div>
  ),
}));

jest.mock('@/components/common/ToastMessage', () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => <div>{message}</div>,
}));

jest.mock('@/assets/icons/common', () => ({
  CopyIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  EditIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

type MeetingStoreState = {
  setIsOpen: jest.Mock;
  meetingInfo: {
    meetingId: string;
    title: string;
    host_nickname: string;
    isHosted: boolean;
    has_password: boolean;
  };
  setMeetingInfo: jest.Mock;
};

const mockUseMeetingStore = useMeetingStore as unknown as jest.MockedFunction<
  <T>(selector?: (state: MeetingStoreState) => T) => T | MeetingStoreState
>;

describe('InfoModal', () => {
  const setIsOpen = jest.fn();
  const setMeetingInfo = jest.fn();

  const meetingInfo: MeetingStoreState['meetingInfo'] = {
    meetingId: 'ROOM-1234',
    title: '테스트 회의',
    host_nickname: '호스트유저',
    isHosted: true,
    has_password: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseMeetingStore.mockImplementation((selector) => {
      const state: MeetingStoreState = {
        setIsOpen,
        meetingInfo,
        setMeetingInfo,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('회의 정보가 정상적으로 렌더링된다', () => {
    render(<InfoModal />);

    expect(screen.getByText('회의 정보')).toBeInTheDocument();
    expect(screen.getByText('테스트 회의')).toBeInTheDocument();
    expect(screen.getByText('호스트유저')).toBeInTheDocument();
    expect(screen.getByText('ROOM-1234')).toBeInTheDocument();
  });

  it('회의 코드를 클릭하면 클립보드에 복사되고 토스트가 표시된다', () => {
    render(<InfoModal />);

    act(() => {
      fireEvent.click(screen.getByText('ROOM-1234'));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ROOM-1234');
    expect(
      screen.getByText('클립보드에 코드가 복사되었습니다'),
    ).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });
  });

  it('호스트일 경우 비밀번호 영역 클릭 시 비밀번호 변경 모달이 열린다', () => {
    render(<InfoModal />);

    act(() => {
      fireEvent.click(screen.getByText('비밀번호'));
    });

    expect(screen.getByText('비밀번호 변경')).toBeInTheDocument();
    expect(
      document.querySelector('input[type="password"]'),
    ).toBeInTheDocument();
  });

  it('비밀번호를 입력하고 확인을 누르면 API가 호출된다', async () => {
    const mockPost = apiWithToken.post as jest.MockedFunction<
      typeof apiWithToken.post
    >;
    mockPost.mockResolvedValueOnce({});

    render(<InfoModal />);

    await act(async () => {
      fireEvent.click(screen.getByText('비밀번호'));
    });

    await act(async () => {
      fireEvent.change(
        document.querySelector('input[type="password"]') as HTMLInputElement,
        { target: { value: '1234' } },
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText('확인'));
    });

    expect(mockPost).toHaveBeenCalledWith('/rooms/ROOM-1234/password', {
      new_password: '1234',
    });
  });
});
