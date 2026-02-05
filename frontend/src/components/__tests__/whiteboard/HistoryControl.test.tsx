import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryControls from '@/components/whiteboard/controls/HistoryControl';
import { useWhiteboardHistory } from '@/hooks/useWhiteboardHistory';

jest.mock('@/hooks/useWhiteboardHistory');

jest.mock('@/assets/icons/whiteboard', () => ({
  UndoIcon: () => <div data-testid="undo-icon">Undo</div>,
  RedoIcon: () => <div data-testid="redo-icon">Redo</div>,
}));

describe('HistoryControls', () => {
  const mockUndo = jest.fn();
  const mockRedo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useWhiteboardHistory as jest.Mock).mockReturnValue({
      undo: mockUndo,
      redo: mockRedo,
    });
  });

  it('컴포넌트가 렌더링된다', () => {
    render(<HistoryControls />);

    expect(screen.getByTitle('실행 취소')).toBeInTheDocument();
    expect(screen.getByTitle('다시 실행')).toBeInTheDocument();
  });

  it('Undo 버튼 클릭 시 undo 함수가 호출된다', async () => {
    const user = userEvent.setup();
    render(<HistoryControls />);

    const undoButton = screen.getByTitle('실행 취소');
    await user.click(undoButton);

    expect(mockUndo).toHaveBeenCalledTimes(1);
  });

  it('Redo 버튼 클릭 시 redo 함수가 호출된다', async () => {
    const user = userEvent.setup();
    render(<HistoryControls />);

    const redoButton = screen.getByTitle('다시 실행');
    await user.click(redoButton);

    expect(mockRedo).toHaveBeenCalledTimes(1);
  });

  it('여러 번 클릭해도 정상 동작한다', async () => {
    const user = userEvent.setup();
    render(<HistoryControls />);

    const undoButton = screen.getByTitle('실행 취소');
    const redoButton = screen.getByTitle('다시 실행');

    await user.click(undoButton);
    await user.click(undoButton);
    await user.click(redoButton);

    expect(mockUndo).toHaveBeenCalledTimes(2);
    expect(mockRedo).toHaveBeenCalledTimes(1);
  });

  it('아이콘이 렌더링된다', () => {
    render(<HistoryControls />);

    expect(screen.getByTestId('undo-icon')).toBeInTheDocument();
    expect(screen.getByTestId('redo-icon')).toBeInTheDocument();
  });
});
