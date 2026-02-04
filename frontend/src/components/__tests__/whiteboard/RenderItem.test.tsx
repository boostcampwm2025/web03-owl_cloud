import { render, screen } from '@testing-library/react';
import RenderItem from '@/components/whiteboard/items/RenderItem';
import { useItemInteraction } from '@/hooks/useItemInteraction';
import { useCursorStyle } from '@/hooks/useCursorStyle';
import type {
  WhiteboardItem,
  TextItem,
  ShapeItem,
  ArrowItem,
} from '@/types/whiteboard';

// 하위 아이템 컴포넌트 모킹
jest.mock('@/components/whiteboard/items/text/TextItem', () => ({
  __esModule: true,
  default: () => <div data-testid="text-item" />,
}));
jest.mock('@/components/whiteboard/items/shape/ShapeItem', () => ({
  __esModule: true,
  default: () => <div data-testid="shape-item" />,
}));
jest.mock('@/components/whiteboard/items/arrow/CustomArrow', () => ({
  __esModule: true,
  default: () => <div data-testid="arrow-item" />,
}));

// 내부 훅 모킹
jest.mock('@/hooks/useItemInteraction');
jest.mock('@/hooks/useCursorStyle');

const mockedUseItemInteraction = useItemInteraction as jest.MockedFunction<
  typeof useItemInteraction
>;
const mockedUseCursorStyle = useCursorStyle as jest.MockedFunction<
  typeof useCursorStyle
>;

describe('RenderItem 컴포넌트', () => {
  const defaultProps = {
    isSelected: false,
    onSelect: jest.fn(),
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseItemInteraction.mockReturnValue({
      isDraggable: true,
      isListening: true,
      isInteractive: true,
    });

    mockedUseCursorStyle.mockReturnValue({
      handleMouseEnter: jest.fn(),
      handleMouseLeave: jest.fn(),
    });
  });

  it('[텍스트 렌더링 확인] item.type이 text일 때 TextItem 컴포넌트를 렌더링하는가', () => {
    const textItem: TextItem = {
      id: '1',
      type: 'text',
      text: 'Hello',
      x: 0,
      y: 0,
      width: 100,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000',
      align: 'center',
      rotation: 0,
      wrap: 'none',
    };

    render(<RenderItem {...defaultProps} item={textItem} />);

    expect(screen.getByTestId('text-item')).toBeInTheDocument();
  });

  it('[도형 렌더링 확인] item.type이 shape일 때 ShapeItem 컴포넌트를 렌더링하는가', () => {
    const shapeItem: ShapeItem = {
      id: '2',
      type: 'shape',
      shapeType: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: '#fff',
      stroke: '#000',
      strokeWidth: 1,
      rotation: 0,
      fontSize: 14,
    };

    render(<RenderItem {...defaultProps} item={shapeItem} />);

    expect(screen.getByTestId('shape-item')).toBeInTheDocument();
  });

  it('[화살표 렌더링 확인] item.type이 arrow일 때 CustomArrow 컴포넌트를 렌더링하는가', () => {
    const arrowItem: ArrowItem = {
      id: '3',
      type: 'arrow',
      points: [0, 0, 10, 10],
      stroke: '#000',
      strokeWidth: 2,
      pointerLength: 10,
      pointerWidth: 10,
      tension: 0,
    };

    render(<RenderItem {...defaultProps} item={arrowItem} />);

    expect(screen.getByTestId('arrow-item')).toBeInTheDocument();
  });

  it('[지원하지 않는 타입 확인] 알 수 없는 type인 경우 null을 반환하는가', () => {
    const unknownItem = {
      id: '4',
      type: 'unknown',
    } as unknown as WhiteboardItem;

    const { container } = render(
      <RenderItem {...defaultProps} item={unknownItem} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
