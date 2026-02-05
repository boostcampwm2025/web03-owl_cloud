import { render, screen, fireEvent } from '@testing-library/react';
import { useUserStore } from '@/store/useUserStore';
import StartMeetingButton from '@/components/landing/StartMeetingButton';

jest.mock('@/components/common/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@/components/common/Modal', () => ({
  __esModule: true,
  default: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock('@/components/landing/MeetingFormModal', () => ({
  __esModule: true,
  default: ({ closeModal }: { closeModal: () => void }) => (
    <div>MeetingFormModal</div>
  ),
}));

jest.mock('@/store/useUserStore', () => ({
  useUserStore: jest.fn(),
}));

const mockedUseUserStore = useUserStore as unknown as jest.MockedFunction<
  typeof useUserStore
>;

describe('StartMeetingButton', () => {
  it('로그인 상태라면 시작하기 클릭 시 설정 모달이 열린다', () => {
    mockedUseUserStore.mockReturnValue({
      isLoggedIn: true,
      isLoaded: true,
    });

    render(<StartMeetingButton />);

    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(screen.getByText('MeetingFormModal')).toBeInTheDocument();
  });

  it('비로그인 상태라면 시작하기 클릭 시 안내 모달이 열린다', () => {
    mockedUseUserStore.mockReturnValue({
      isLoggedIn: false,
      isLoaded: true,
    });

    render(<StartMeetingButton />);

    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));

    expect(
      screen.getByRole('heading', { name: '회의 생성 실패' }),
    ).toBeInTheDocument();
    expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
  });
});
