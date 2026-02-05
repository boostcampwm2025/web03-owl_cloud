import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/common/button';

describe('Button Component', () => {
  describe('1. Render Test', () => {
    it('1-1. 버튼이 렌더되면 children 또한 렌더링되어야 한다.', () => {
      render(<Button>children</Button>);
      expect(
        screen.getByRole('button', { name: 'children' }),
      ).toBeInTheDocument();
    });
  });

  describe('2. Interaction Test', () => {
    it('2-1. 버튼을 클릭하면 onClick이 호출되어야 한다.', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(<Button onClick={onClick}>클릭</Button>);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('2-2. 버튼이 disabled상태이면 클릭이 동작하지 않아야 한다.', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <Button onClick={onClick} disabled>
          클릭
        </Button>,
      );
      const btn = screen.getByRole('button');
      await user.click(btn);

      expect(onClick).not.toHaveBeenCalled();
      expect(btn).toBeDisabled();
    });
  });

  describe('3. Props Test', () => {
    it('3-1. 버튼에 지정된 size props가 class에 반영되어야 한다.', () => {
      render(<Button size="sm">btn</Button>);
      const btn = screen.getByRole('button');

      expect(btn.className).toMatch(/text-sm/);
    });

    it('3-2. 버튼에 지정된 shape props가 class에 반영되어야 한다.', () => {
      render(<Button shape="square">btn</Button>);
      const btn = screen.getByRole('button');

      expect(btn.className).toMatch(/rounded-lg/);
    });

    it('3-3. 버튼에 지정된 color props가 class에 반영되어야 한다.', () => {
      render(<Button color="outlinePrimary">btn</Button>);
      const btn = screen.getByRole('button');

      expect(btn.className).toMatch(/border/);
    });

    it('3-4. className이 병합된다', () => {
      render(<Button className="custom-class">btn</Button>);
      const btn = screen.getByRole('button');

      expect(btn).toHaveClass('custom-class');
    });
  });
});
