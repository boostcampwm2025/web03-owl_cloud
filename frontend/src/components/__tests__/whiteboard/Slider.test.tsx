import { render, screen, fireEvent } from '@testing-library/react';
import Slider from '@/components/whiteboard/sidebar/ui/Slider';

describe('Slider 컴포넌트', () => {
  const defaultProps = {
    label: 'Opacity',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[렌더링 확인] 라벨과 현재 수치가 화면에 올바르게 표시되는가', () => {
    render(<Slider {...defaultProps} />);

    // 라벨 텍스트 확인
    expect(screen.getByText('Opacity')).toBeInTheDocument();
    // 현재 값 텍스트 확인
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('[수치 변경 확인] 슬라이더 값을 변경했을 때 onChange 핸들러가 숫자 형식의 데이터와 함께 호출되는가', () => {
    render(<Slider {...defaultProps} />);

    const sliderInput = screen.getByRole('slider') as HTMLInputElement;

    // 슬라이더 값을 80으로 변경하는 이벤트 발생
    fireEvent.change(sliderInput, { target: { value: '80' } });

    // onChange가 호출되었는지, 인자가 숫자(Number) 타입인지 확인
    expect(defaultProps.onChange).toHaveBeenCalledWith(80);
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
  });

  it('[속성 적용 확인] min, max, step 값이 input 엘리먼트에 올바르게 주입되었는가', () => {
    render(<Slider {...defaultProps} min={10} max={200} step={5} />);

    const sliderInput = screen.getByRole('slider') as HTMLInputElement;

    expect(sliderInput.min).toBe('10');
    expect(sliderInput.max).toBe('200');
    expect(sliderInput.step).toBe('5');
  });

  it('[입력 제약 확인] 정해진 범위를 벗어나는 값 입력 시 브라우저 기본 동작에 따라 값이 조절되는가', () => {
    render(<Slider {...defaultProps} max={100} />);

    const sliderInput = screen.getByRole('slider') as HTMLInputElement;

    // max값인 100보다 큰 150을 입력 시도
    fireEvent.change(sliderInput, { target: { value: '150' } });

    // range input의 특성상 max값인 100으로 호출됨
    expect(defaultProps.onChange).toHaveBeenCalledWith(100);
  });
});
