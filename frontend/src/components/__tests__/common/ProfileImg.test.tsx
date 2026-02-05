import ProfileImg from '@/components/common/ProfileImg';
import { render, screen } from '@testing-library/react';

// next/image는 테스트 환경에서 mock 처리
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('ProfileImg', () => {
  it('profilePath가 있을 경우 프로필 이미지가 렌더링된다', () => {
    render(
      <ProfileImg profilePath="/profile.png" nickname="윤장호" size={64} />,
    );

    const img = screen.getByRole('img', {
      name: '윤장호님의 프로필 사진',
    });

    expect(img).toBeInTheDocument();
  });

  it('profilePath가 없을 경우 닉네임의 첫 글자가 렌더링된다', () => {
    render(<ProfileImg profilePath={null} nickname="윤장호" size={64} />);

    expect(screen.getByText('윤')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
