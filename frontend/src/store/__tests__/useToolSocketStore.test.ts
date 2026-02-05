import { useToolSocketStore } from '../useToolSocketStore';
import { Socket } from 'socket.io-client';

describe('useToolSocketStore', () => {
  beforeEach(() => {
    useToolSocketStore.setState({
      codeEditorSocket: null,
      whiteboardSocket: null,
    });
  });

  it('초기 상태는 모든 소켓이 null이어야 한다.', () => {
    const state = useToolSocketStore.getState();

    expect(state.codeEditorSocket).toBeNull();
    expect(state.whiteboardSocket).toBeNull();
  });

  it('setCodeEditorSocket 호출 시 codeEditorSocket이 저장되어야 한다.', () => {
    const mockSocket = {} as Socket;

    useToolSocketStore.getState().setCodeEditorSocket(mockSocket);

    const state = useToolSocketStore.getState();

    expect(state.codeEditorSocket).toBe(mockSocket);
  });

  it('setWhiteboardSocket 호출 시 whiteboardSocket이 저장되어야 한다.', () => {
    const mockSocket = {} as Socket;

    useToolSocketStore.getState().setWhiteboardSocket(mockSocket);

    const state = useToolSocketStore.getState();

    expect(state.whiteboardSocket).toBe(mockSocket);
  });

  it('socket은 null로 다시 설정될 수 있어야 한다.', () => {
    const mockSocket = {} as Socket;

    const { setCodeEditorSocket } = useToolSocketStore.getState();

    setCodeEditorSocket(mockSocket);
    setCodeEditorSocket(null);

    expect(useToolSocketStore.getState().codeEditorSocket).toBeNull();
  });
});
