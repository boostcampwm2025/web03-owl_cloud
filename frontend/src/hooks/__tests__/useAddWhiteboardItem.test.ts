import { renderHook, act } from '@testing-library/react';
import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234',
}));

// 외부 의존성 모킹
jest.mock('@/hooks/useItemActions');
jest.mock('@/store/useWhiteboardLocalStore');

// 타입 안전을 위한 모킹 함수 캐스팅
const mockedUseItemActions = useItemActions as jest.MockedFunction<
  typeof useItemActions
>;
const mockedUseWhiteboardLocalStore = useWhiteboardLocalStore as unknown as {
  getState: jest.Mock;
};

describe('useAddWhiteboardItem', () => {
  // 모킹된 액션들을 추적하기 위한 Mock 함수 정의
  const mockActions = {
    addText: jest.fn(),
    addArrow: jest.fn(),
    addLine: jest.fn(),
    addShape: jest.fn(),
    addImage: jest.fn(),
    addStack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // useItemActions가 반환해야 하는 실제 타입으로 캐스팅하여 주입
    mockedUseItemActions.mockReturnValue(
      mockActions as unknown as ReturnType<typeof useItemActions>,
    );

    // 스토어 상태 모킹 : 중앙 좌표 계산용 (1000x1000 뷰포트 가정)
    mockedUseWhiteboardLocalStore.getState.mockReturnValue({
      stageRef: { current: null },
      stagePos: { x: 0, y: 0 },
      stageScale: 1,
      viewportWidth: 1000,
      viewportHeight: 1000,
    });

    // 브라우저 alert 함수 모킹
    window.alert = jest.fn();
  });

  it('[텍스트 추가 확인] handleAddText 호출 시 중앙 좌표가 올바르게 계산되어 전달되는가', () => {
    const { result } = renderHook(() => useAddWhiteboardItem());

    act(() => {
      result.current.handleAddText();
    });

    expect(mockActions.addText).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 400,
        y: 484,
      }),
    );
  });

  it('[화살표 추가 확인] handleAddArrow 호출 시 중앙 좌표를 기준으로 화살표 점들이 생성되는가', () => {
    const { result } = renderHook(() => useAddWhiteboardItem());

    act(() => {
      result.current.handleAddArrow();
    });

    // 중앙(500, 500) 기준 좌우 100픽셀씩
    expect(mockActions.addArrow).toHaveBeenCalledWith({
      points: [400, 500, 600, 500],
    });
  });

  it('[도형 추가 확인] handleAddShape 호출 시 도형 타입과 중앙 좌표가 올바르게 전달되는가', () => {
    const { result } = renderHook(() => useAddWhiteboardItem());

    act(() => {
      result.current.handleAddShape('rect');
    });

    expect(mockActions.addShape).toHaveBeenCalledWith(
      'rect',
      expect.objectContaining({
        x: 450,
        y: 450,
      }),
    );
  });

  it('[이미지 제한 확인] GIF 파일이나 대용량 파일 시 로직이 중단되는가', () => {
    const { result } = renderHook(() => useAddWhiteboardItem());

    // GIF 파일 케이스
    const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
    act(() => {
      result.current.processImageFile(gifFile);
    });
    expect(window.alert).toHaveBeenCalledWith(
      'GIF 파일은 업로드할 수 없습니다.',
    );
    expect(mockActions.addImage).not.toHaveBeenCalled();

    // 대용량 파일 케이스
    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)],
      'large.png',
      { type: 'image/png' },
    );
    act(() => {
      result.current.processImageFile(largeFile);
    });
    expect(window.alert).toHaveBeenCalledWith(
      '이미지 용량은 10MB를 초과할 수 없습니다.',
    );
  });

  it('[스택 추가 확인] handleAddStack 호출 시 아이콘 정보가 올바른 좌표로 전달되는가', () => {
    const { result } = renderHook(() => useAddWhiteboardItem());

    type StackParam = Parameters<typeof result.current.handleAddStack>[0];

    const mockIcon: StackParam = {
      id: 'react-icon-id',
      src: 'test.svg',
      name: 'TestIcon',
      category: 'frontend',
    };

    act(() => {
      result.current.handleAddStack(mockIcon);
    });

    expect(mockActions.addStack).toHaveBeenCalledWith(
      expect.objectContaining({
        stackName: 'TestIcon',
        x: 380,
        y: 380,
      }),
    );
  });
});
