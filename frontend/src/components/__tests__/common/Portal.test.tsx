import { render, screen, cleanup } from '@testing-library/react';
import Portal from '@/components/common/Portal';

describe('Portal', () => {
  afterEach(() => {
    cleanup();
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) {
      modalRoot.remove();
    }
  });

  it('modal-root가 존재하면 children을 portal로 렌더링한다', () => {
    // given
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);

    // when
    render(
      <Portal>
        <div>포탈 내용</div>
      </Portal>,
    );

    // then
    expect(screen.getByText('포탈 내용')).toBeInTheDocument();
  });

  it('modal-root가 없으면 아무것도 렌더링하지 않는다', () => {
    // when
    render(
      <Portal>
        <div>포탈 내용</div>
      </Portal>,
    );

    // then
    expect(screen.queryByText('포탈 내용')).toBeNull();
  });
});
