import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/common/Modal';
import { ModalProps } from '@/types/common';

// Portal은 DOM 계층만 바꾸는 역할이므로 단순 mock
jest.mock('@/components/common/Portal', () => {
  return function MockPortal({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

describe('Modal', () => {
  const baseProps: ModalProps = {
    title: '테스트 모달',
    cancelText: '취소',
    onCancel: jest.fn(),
    confirmText: '확인',
    onConfirm: jest.fn(),
    children: <div>모달 내용</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('title과 children, cancel 버튼을 렌더링한다', () => {
    render(<Modal {...baseProps} />);

    expect(screen.getByText('테스트 모달')).toBeInTheDocument();
    expect(screen.getByText('모달 내용')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('confirmText와 onConfirm이 있을 때만 confirm 버튼을 렌더링한다', () => {
    render(<Modal {...baseProps} />);

    expect(screen.getByText('확인')).toBeInTheDocument();
  });

  it('confirmText가 없으면 confirm 버튼을 렌더링하지 않는다', () => {
    const propsWithoutConfirm: ModalProps = {
      ...baseProps,
      confirmText: undefined,
      onConfirm: undefined,
    };

    render(<Modal {...propsWithoutConfirm} />);

    expect(screen.queryByText('확인')).not.toBeInTheDocument();
  });

  it('cancel 버튼 클릭 시 onCancel이 호출된다', () => {
    render(<Modal {...baseProps} />);

    fireEvent.click(screen.getByText('취소'));

    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm 버튼 클릭 시 onConfirm이 호출된다', () => {
    render(<Modal {...baseProps} />);

    fireEvent.click(screen.getByText('확인'));

    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('배경에서 클릭 시작 후 배경에서 클릭 종료 시 모달이 닫힌다', () => {
    render(<Modal {...baseProps} />);

    const dialog = screen.getByText('모달 내용').closest('dialog')!;
    const overlay = dialog.parentElement!;

    fireEvent.mouseDown(overlay);
    fireEvent.mouseUp(overlay);

    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('모달 내부에서 클릭 시작하면 배경에서 mouseUp 해도 닫히지 않는다', () => {
    render(<Modal {...baseProps} />);

    const dialog = screen.getByText('모달 내용').closest('dialog')!;
    const overlay = dialog.parentElement!;

    fireEvent.mouseDown(dialog);
    fireEvent.mouseUp(overlay);

    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });

  it('배경에서 클릭 시작했지만 내부에서 mouseUp 하면 닫히지 않는다', () => {
    render(<Modal {...baseProps} />);

    const dialog = screen.getByText('모달 내용').closest('dialog')!;
    const overlay = dialog.parentElement!;

    fireEvent.mouseDown(overlay);
    fireEvent.mouseUp(dialog);

    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });
});
