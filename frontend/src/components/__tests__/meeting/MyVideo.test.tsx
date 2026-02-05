import { render, screen } from '@testing-library/react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useUserStore } from '@/store/useUserStore';
import { useVoiceActivity } from '@/hooks/useVoiceActivity';
import { Producer } from 'mediasoup-client/types';
import MyVideo from '@/components/meeting/MyVideo';
import { INITIAL_MEDIA_STATE } from '@/constants/meeting';

jest.mock('@/hooks/useVoiceActivity', () => ({
  useVoiceActivity: jest.fn(),
}));

jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

jest.mock('@/components/meeting/media/VideoView', () => {
  const MockVideoView = ({ stream }: { stream: MediaStream }) => (
    <div data-testid="video-view" data-stream-id={stream.id}>
      Video View
    </div>
  );
  MockVideoView.displayName = 'MockVideoView';
  return MockVideoView;
});

jest.mock('@/components/common/ProfileImg', () => {
  const MockProfile = ({ nickname }: { nickname: string }) => (
    <div data-testid="profile-img">{nickname} Profile</div>
  );
  MockProfile.displayName = 'MockProfileImg';
  return MockProfile;
});

jest.mock('@/assets/icons/meeting', () => ({
  MicOffIcon: () => <div data-testid="mic-off-icon" />,
}));

// JSDOM 환경용 MediaStream Mock (타입 단언은 unknown as Type 사용)
global.MediaStream = jest.fn().mockImplementation((tracks) => ({
  id: 'mock-stream-id',
  getTracks: () => tracks || [],
})) as unknown as typeof MediaStream;

describe('<MyVideo />', () => {
  beforeEach(() => {
    // 1. Meeting Store 초기화
    useMeetingStore.setState({
      media: INITIAL_MEDIA_STATE,
    });

    // 2. User Store 초기화
    useUserStore.setState({
      nickname: 'My Nickname',
      profilePath: 'path/to/profile',
    });

    // 3. Socket Store 초기화
    useMeetingSocketStore.setState({
      camStream: null,
      producers: {
        audioProducer: null,
        videoProducer: null,
        screenAudioProducer: null,
        screenVideoProducer: null,
      },
    });

    // 4. Hook Return Value 초기화
    (useVoiceActivity as jest.Mock).mockReturnValue(false);
  });

  it('비디오가 꺼져있으면(videoOn: false) ProfileImg를 렌더링한다', () => {
    // Given
    useMeetingStore.setState({
      media: { ...INITIAL_MEDIA_STATE, videoOn: false, audioOn: false },
    });

    // When
    render(<MyVideo />);

    // Then
    expect(screen.getByTestId('profile-img')).toBeInTheDocument();
    expect(screen.getByText('My Nickname Profile')).toBeInTheDocument();
    expect(screen.queryByTestId('video-view')).not.toBeInTheDocument();
  });

  it('비디오가 켜져있고(videoOn: true) camStream이 있으면 VideoView를 렌더링한다', () => {
    // Given
    const mockCamStream = { id: 'cam-stream-1' } as unknown as MediaStream;

    useMeetingStore.setState({
      media: { ...INITIAL_MEDIA_STATE, videoOn: true, audioOn: false },
    });
    useMeetingSocketStore.setState({
      camStream: mockCamStream,
    });

    // When
    render(<MyVideo />);

    // Then
    const videoView = screen.getByTestId('video-view');
    expect(videoView).toBeInTheDocument();
    expect(videoView).toHaveAttribute('data-stream-id', 'cam-stream-1');
  });

  it('비디오가 켜져있고 camStream은 없지만 Producer Track이 있으면, 스트림을 생성해 렌더링한다', () => {
    // Given
    const mockTrack = { kind: 'video' } as MediaStreamTrack;

    // Producer 타입에 맞게 Mocking (unknown as Producer 사용)
    const mockVideoProducer = {
      track: mockTrack,
    } as unknown as Producer;

    useMeetingStore.setState({
      media: { ...INITIAL_MEDIA_STATE, videoOn: true, audioOn: false },
    });
    useMeetingSocketStore.setState({
      camStream: null,
      producers: {
        audioProducer: null,
        videoProducer: mockVideoProducer,
        screenAudioProducer: null,
        screenVideoProducer: null,
      },
    });

    // When
    render(<MyVideo />);

    // Then
    const videoView = screen.getByTestId('video-view');
    expect(videoView).toBeInTheDocument();
    // global.MediaStream Mock이 'mock-stream-id'를 반환
    expect(videoView).toHaveAttribute('data-stream-id', 'mock-stream-id');
  });

  it('오디오가 꺼져있으면(audioOn: false) 마이크 꺼짐 아이콘이 표시된다', () => {
    // Given
    useMeetingStore.setState({
      media: { ...INITIAL_MEDIA_STATE, audioOn: false, videoOn: false },
    });

    // When
    render(<MyVideo />);

    // Then
    expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument();
  });

  it('오디오가 켜져있으면(audioOn: true) 마이크 꺼짐 아이콘이 사라진다', () => {
    // Given
    useMeetingStore.setState({
      media: { ...INITIAL_MEDIA_STATE, audioOn: true, videoOn: false },
    });

    // When
    render(<MyVideo />);

    // Then
    expect(screen.queryByTestId('mic-off-icon')).not.toBeInTheDocument();
  });

  it('오디오가 켜져있고 발언 중(isSpeaking: true)이면 파란색 테두리가 표시된다', () => {
    // Given
    useMeetingStore.setState({
      media: { ...INITIAL_MEDIA_STATE, audioOn: true, videoOn: false },
    });
    (useVoiceActivity as jest.Mock).mockReturnValue(true);

    // When
    render(<MyVideo />);

    // Then
    const borderDiv = document.querySelector('.border-sky-500');
    expect(borderDiv).toBeInTheDocument();
  });

  it('발언 중이라도(isSpeaking: true) 오디오가 꺼져있으면(audioOn: false) 테두리가 표시되지 않는다', () => {
    // Given
    useMeetingStore.setState({
      media: { ...INITIAL_MEDIA_STATE, audioOn: false, videoOn: false },
    });
    (useVoiceActivity as jest.Mock).mockReturnValue(true);

    // When
    render(<MyVideo />);

    // Then
    const borderDiv = document.querySelector('.border-sky-500');
    expect(borderDiv).not.toBeInTheDocument();
  });
});
