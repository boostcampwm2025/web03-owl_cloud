// src/components/__tests__/Hello.test.tsx
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header" />,
}));

describe('Hello component', () => {
  it('로고의 텍스트가 렌더링된다', () => {
    render(<Home />);
    expect(screen.getByText('dev:')).toBeInTheDocument();
    expect(screen.getByText('meet')).toBeInTheDocument();
  });
});
