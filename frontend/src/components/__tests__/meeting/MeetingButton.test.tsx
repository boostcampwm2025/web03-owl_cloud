import MeetingButton from '@/components/meeting/MeetingButton';
import { render, screen, fireEvent } from '@testing-library/react';

describe('<MeetingButton />', () => {
  const defaultProps = {
    icon: <span data-testid="icon">🎤</span>,
    text: '마이크',
    onClick: jest.fn(),
  };

  it('아이콘과 텍스트가 정상적으로 렌더링된다', () => {
    render(<MeetingButton {...defaultProps} />);

    expect(screen.getByText('마이크')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('isActive가 true일 때 활성화 스타일(bg-sky-700)이 적용된다', () => {
    render(<MeetingButton {...defaultProps} isActive={true} />);

    const button = screen.getByRole('button');
    // Tailwind 클래스가 포함되어 있는지 확인
    expect(button).toHaveClass('bg-sky-700');
    expect(button).not.toHaveClass('hover:bg-neutral-700');
  });

  it('isActive가 false일 때 기본 스타일(hover:bg-neutral-700)이 적용된다', () => {
    render(<MeetingButton {...defaultProps} isActive={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-neutral-700');
    expect(button).not.toHaveClass('bg-sky-700');
  });

  it('버튼 클릭 시 onClick 핸들러가 호출된다', () => {
    render(<MeetingButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });
});
