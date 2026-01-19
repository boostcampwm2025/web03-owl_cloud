// 유튜브 URL 비디오 ID 추출 함수
export const extractYoutubeId = (url: string): string | null => {
  // 정규표현식 : 유튜브 비디오 ID 추출
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// 썸네일 URL 생성 함수
// maxresdefault : 고화질
export const getMaxResThumbnailUrl = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

// hqdefault : 거의 모든 유튜브 영상에 존재
export const getHqThumbnailUrl = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};
