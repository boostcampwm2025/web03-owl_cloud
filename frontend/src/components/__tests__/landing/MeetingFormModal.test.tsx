import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MeetingFormModal from '@/components/landing/MeetingFormModal';
import { apiWithToken } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import { ModalProps } from '@/types/common';

// mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/utils/apiClient', () => ({
  apiWithToken: {
    post: jest.fn(),
  },
}));

jest.mock('@/store/useUserStore', () => ({
  useUserStore: () => ({
    nickname: '테스터',
  }),
}));

jest.mock('@/components/common/Modal', () => {
  return function MockModal(props: ModalProps) {
    const { title, children, confirmText, cancelText, onConfirm, onCancel } =
      props;

    return (
      <div>
        <h1>{title}</h1>
        <div>{children}</div>
        {confirmText && <button onClick={onConfirm}>{confirmText}</button>}
        {cancelText && <button onClick={onCancel}>{cancelText}</button>}
      </div>
    );
  };
});

describe('MeetingFormModal 컴포넌트 테스트', () => {
  const closeModal = jest.fn();
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('기본 상태로 렌더링된다', () => {
    render(<MeetingFormModal closeModal={closeModal} />);

    expect(screen.getByText('회의 생성')).toBeInTheDocument();
    expect(screen.getByDisplayValue(1)).toBeInTheDocument();
    expect(screen.getByDisplayValue('테스터 님의 회의실')).toBeInTheDocument();
  });

  it('회의명 입력값이 상태에 반영된다', () => {
    render(<MeetingFormModal closeModal={closeModal} />);

    const input = screen.getByPlaceholderText('회의명을 입력해주세요');
    fireEvent.change(input, { target: { value: '새 회의' } });

    expect(input).toHaveValue('새 회의');
  });

  it('최대 인원 0 입력 시 최소값(1)으로 보정된다', () => {
    render(<MeetingFormModal closeModal={closeModal} />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: 0 } });

    expect(input).toHaveValue(1);
  });

  it('최대 인원 1은 유효한 값이다', () => {
    render(<MeetingFormModal closeModal={closeModal} />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: 1 } });

    expect(input).toHaveValue(1);
  });

  it('최대 인원 100은 유효한 값이다', () => {
    render(<MeetingFormModal closeModal={closeModal} />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: 100 } });

    expect(input).toHaveValue(100);
  });

  it('최대 인원 101 입력 시 최대값(100)으로 보정된다', () => {
    render(<MeetingFormModal closeModal={closeModal} />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: 101 } });

    expect(input).toHaveValue(100);
  });

  it('회의명이 빈 문자열이면 validation 실패로 API를 호출하지 않는다', async () => {
    render(<MeetingFormModal closeModal={closeModal} />);

    const input = screen.getByPlaceholderText('회의명을 입력해주세요');
    fireEvent.change(input, { target: { value: '' } });

    fireEvent.click(screen.getByText('생성'));

    await waitFor(() => {
      expect(screen.getByText('회의 생성 실패')).toBeInTheDocument();
    });

    expect(apiWithToken.post).not.toHaveBeenCalled();
  });

  it('경계값이지만 유효한 입력이면 API 호출 후 라우팅된다', async () => {
    (apiWithToken.post as jest.Mock).mockResolvedValue({ code: 'room123' });

    render(<MeetingFormModal closeModal={closeModal} />);

    fireEvent.click(screen.getByText('생성'));

    await waitFor(() => {
      expect(apiWithToken.post).toHaveBeenCalledWith('/rooms', {
        max_participants: 1,
        title: '테스터 님의 회의실',
        password: undefined,
      });
    });

    expect(push).toHaveBeenCalledWith('/room123');
  });

  it('제출 직후 로딩 상태가 표시된다', async () => {
    let resolveFn!: (value: { code: string }) => void;

    (apiWithToken.post as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        }),
    );

    render(<MeetingFormModal closeModal={closeModal} />);
    fireEvent.click(screen.getByText('생성'));

    expect(screen.getByText('회의를 생성 중입니다...')).toBeInTheDocument();

    resolveFn({ code: 'room123' });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/room123');
    });
  });
});
