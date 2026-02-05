import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toggle from '@/components/common/toggle';

describe('Toggle Component', () => {
  describe('1. Render Test', () => {
    it('1-1. 토글 컴포넌트의 role이 switch로 렌더링되어야 한다.', () => {
      render(<Toggle />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
    });
    it('1-2. 토글 컴포넌트의 기본 상태 defaultCheked 값은 off여야 한다.', () => {
      render(<Toggle />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('2. Uncontrolled Test', () => {
    it('2-1. 토글을 클릭하면 (기본 상태라면) 상태가 on으로 바뀌어야 한다.', async () => {
      const user = userEvent.setup();

      render(<Toggle defaultChecked={false} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
    it('2-2. (기본 상태에서) 토글을 2번 클릭하면서 다시 off로 돌아와야 한다.', async () => {
      //
      const user = userEvent.setup();

      render(<Toggle defaultChecked={false} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('2-3. 상태 변경 시 onChange가 호출되어야 한다.', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<Toggle onChange={onChange} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('3. Controlled Test', () => {
    it('3-1. controlled 모드일 때는 토글을 클릭해도 상태가 바뀌지 않아야 한다.', async () => {
      const user = userEvent.setup();
      render(<Toggle checked={false} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('3-2. 토글의 checked prop의 값에 따라 화면 상태를 정확히 반영해야 한다.', () => {
      const { rerender } = render(<Toggle checked={false} />);
      const toggle = screen.getByRole('switch');

      expect(toggle).toHaveAttribute('aria-checked', 'false');

      rerender(<Toggle checked={true} />);

      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('4. Disabled Test', () => {
    it('4-1. 토글 상태가 disabled이면 클릭해도 변화가 없어야 한다.', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<Toggle disabled onChange={onChange} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
