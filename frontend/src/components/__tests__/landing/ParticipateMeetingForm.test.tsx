import { fireEvent, render, screen } from '@testing-library/react';
import { parseRoomPath } from '@/utils/formatter';
import { useRouter } from 'next/navigation';
import ParticipateMeetingForm from '@/components/landing/ParticipateMeetingForm';

// Button은 내부 구현 중요하지 않으므로 단순화
jest.mock('@/components/common/button', () => ({
  __esModule: true,
  default: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/utils/formatter', () => ({
  parseRoomPath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('ParticipateMeetingForm', () => {
  const push = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('회의 코드 또는 링크를 입력하고 제출하면 해당 경로로 이동한다', async () => {
    (parseRoomPath as jest.Mock).mockReturnValue('/meeting/123');

    render(<ParticipateMeetingForm />);

    const input = screen.getByPlaceholderText('코드 또는 링크를 입력해주세요');
    const submitButton = screen.getByRole('button', { name: '참여하기' });

    fireEvent.change(input, { target: { value: 'meeting-code' } });
    fireEvent.click(submitButton);

    expect(parseRoomPath).toHaveBeenCalledWith('meeting-code');
    expect(push).toHaveBeenCalledWith('/meeting/123');
  });
});
