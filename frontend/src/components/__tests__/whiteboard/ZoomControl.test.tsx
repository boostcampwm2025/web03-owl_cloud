import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ZoomControls from '@/components/whiteboard/controls/ZoomControl';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
  v7: () => 'test-uuid-v7-1234',
}));

jest.mock('@/store/useWhiteboardLocalStore');

jest.mock('@/assets/icons/whiteboard', () => ({
  ZoomInIcon: () => <div data-testid="zoom-in-icon">+</div>,
  ZoomOutIcon: () => <div data-testid="zoom-out-icon">-</div>,
}));

describe('ZoomControls', () => {
  const mockSetStageScale = jest.fn();
  const mockSetStagePos = jest.fn();
  const mockStageRef = {
    current: {
      scale: jest.fn(),
      position: jest.fn(),
      batchDraw: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useWhiteboardLocalStore as unknown as jest.Mock).mockImplementation(
      (selector) => {
        const state = {
          stageScale: 1,
          stagePos: { x: 0, y: 0 },
          setStageScale: mockSetStageScale,
          setStagePos: mockSetStagePos,
          stageRef: mockStageRef,
        };
        return selector ? selector(state) : state;
      },
    );

    (
      useWhiteboardLocalStore as unknown as jest.Mock & {
        getState: jest.Mock;
      }
    ).getState = jest.fn(() => ({
      stageScale: 1,
      stagePos: { x: 0, y: 0 },
      setStageScale: mockSetStageScale,
      setStagePos: mockSetStagePos,
      stageRef: mockStageRef,
    }));

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  it('컴포넌트가 렌더링된다', () => {
    render(<ZoomControls />);

    expect(screen.getByTitle('확대')).toBeInTheDocument();
    expect(screen.getByTitle('축소')).toBeInTheDocument();
  });

  it('현재 줌 레벨을 퍼센트로 표시한다', () => {
    render(<ZoomControls />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('줌 레벨이 변경되면 표시가 업데이트된다', () => {
    (useWhiteboardLocalStore as unknown as jest.Mock).mockImplementation(
      (selector) => {
        const state = {
          stageScale: 1.5,
          stagePos: { x: 0, y: 0 },
          setStageScale: mockSetStageScale,
          setStagePos: mockSetStagePos,
          stageRef: mockStageRef,
        };
        return selector ? selector(state) : state;
      },
    );

    render(<ZoomControls />);

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('Zoom In 버튼 클릭 시 줌이 증가한다', async () => {
    const user = userEvent.setup();
    render(<ZoomControls />);

    const zoomInButton = screen.getByTitle('확대');
    await user.click(zoomInButton);

    expect(mockSetStageScale).toHaveBeenCalled();
    expect(mockSetStagePos).toHaveBeenCalled();
  });

  it('Zoom Out 버튼 클릭 시 줌이 감소한다', async () => {
    const user = userEvent.setup();
    render(<ZoomControls />);

    const zoomOutButton = screen.getByTitle('축소');
    await user.click(zoomOutButton);

    expect(mockSetStageScale).toHaveBeenCalled();
    expect(mockSetStagePos).toHaveBeenCalled();
  });

  it('Stage가 업데이트된다', async () => {
    const user = userEvent.setup();
    render(<ZoomControls />);

    const zoomInButton = screen.getByTitle('확대');
    await user.click(zoomInButton);

    expect(mockStageRef.current.scale).toHaveBeenCalled();
    expect(mockStageRef.current.position).toHaveBeenCalled();
    expect(mockStageRef.current.batchDraw).toHaveBeenCalled();
  });

  it('아이콘이 렌더링된다', () => {
    render(<ZoomControls />);

    expect(screen.getByTestId('zoom-in-icon')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-out-icon')).toBeInTheDocument();
  });

  it('소수점 줌 레벨도 정수로 표시한다', () => {
    (useWhiteboardLocalStore as unknown as jest.Mock).mockImplementation(
      (selector) => {
        const state = {
          stageScale: 1.234,
          stagePos: { x: 0, y: 0 },
          setStageScale: mockSetStageScale,
          setStagePos: mockSetStagePos,
          stageRef: mockStageRef,
        };
        return selector ? selector(state) : state;
      },
    );

    render(<ZoomControls />);

    expect(screen.getByText('123%')).toBeInTheDocument();
  });

  it('매우 작은 줌 레벨도 표시한다', () => {
    (useWhiteboardLocalStore as unknown as jest.Mock).mockImplementation(
      (selector) => {
        const state = {
          stageScale: 0.1,
          stagePos: { x: 0, y: 0 },
          setStageScale: mockSetStageScale,
          setStagePos: mockSetStagePos,
          stageRef: mockStageRef,
        };
        return selector ? selector(state) : state;
      },
    );

    render(<ZoomControls />);

    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('매우 큰 줌 레벨도 표시한다', () => {
    (useWhiteboardLocalStore as unknown as jest.Mock).mockImplementation(
      (selector) => {
        const state = {
          stageScale: 5,
          stagePos: { x: 0, y: 0 },
          setStageScale: mockSetStageScale,
          setStagePos: mockSetStagePos,
          stageRef: mockStageRef,
        };
        return selector ? selector(state) : state;
      },
    );

    render(<ZoomControls />);

    expect(screen.getByText('500%')).toBeInTheDocument();
  });
});
