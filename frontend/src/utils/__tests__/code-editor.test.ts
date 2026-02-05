import { colorFromClientId, injectCursorStyles } from '../code-editor';

describe('colorFromClientId 함수 테스트', () => {
  it('같은 clientId이면 같은 색상이 반환되어야 한다.', () => {
    const a = colorFromClientId(1);
    const b = colorFromClientId(1);

    expect(a).toEqual(b);
  });

  it('다른 clientId이면 다른 색상이 반환되어야 한다.', () => {
    const a = colorFromClientId(1);
    const b = colorFromClientId(2);

    expect(a.cursor).not.toBe(b.cursor);
  });

  it('cursor 색상은 hsl 포맷이어야 한다.', () => {
    const c = colorFromClientId(5);

    expect(c.cursor).toMatch(/^hsl\(\d+(\.\d+)?, 80%, 45%\)$/);
  });
});

describe('injectCursorStyles 함수 테스트', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('style 태그가 생성되어야 한다.', () => {
    injectCursorStyles(1, 'red', 'kim');

    const style = document.getElementById('cursor-style-1');

    expect(style).toBeInTheDocument();
  });

  it('style 태그에 clientId dataset이 설정되어야 한다.', () => {
    injectCursorStyles(2, 'blue', 'lee');

    const style = document.getElementById('cursor-style-2');

    expect(style?.dataset.clientId).toBe('2');
  });

  it('style 내용에 사용자 이름이 포함되어야 한다.', () => {
    injectCursorStyles(3, 'green', 'park');

    const style = document.getElementById('cursor-style-3');

    expect(style?.textContent).toContain('park');
  });

  it('같은 clientId로 두 번 호출해도 중복 생성되면 안 된다.', () => {
    injectCursorStyles(4, 'red', 'kim');
    injectCursorStyles(4, 'red', 'kim');

    const styles = document.querySelectorAll('#cursor-style-4');

    expect(styles.length).toBe(1);
  });

  it('style 태그가 head에 추가되어야 한다.', () => {
    injectCursorStyles(5, 'purple', 'choi');

    const style = document.getElementById('cursor-style-5');

    expect(document.head.contains(style)).toBe(true);
  });
});
