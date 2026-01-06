export const DUMMY_MEMBERS = [
  {
    id: '1',
    name: 'Tony',
    audio: true,
    video: false,
    speaking: true,
    profileImg: `https://picsum.photos/id/237/200/200`,
  },
  {
    id: '2',
    name: 'Logan',
    audio: false,
    video: false,
    speaking: false,
    profileImg: `https://picsum.photos/id/238/200/200`,
  },
  {
    id: '3',
    name: 'Andrew',
    audio: true,
    video: true,
    speaking: false,
    profileImg: `https://picsum.photos/id/239/200/200`,
  },
  {
    id: '4',
    name: 'Lisey',
    audio: true,
    video: true,
    speaking: true,
    profileImg: `https://picsum.photos/id/240/200/200`,
  },
  {
    id: '5',
    name: 'Kuma',
    audio: true,
    video: true,
    speaking: false,
    profileImg: `https://picsum.photos/id/241/200/200`,
  },
  {
    id: '6',
    name: 'Robert John Downey Junior',
    audio: false,
    video: true,
    speaking: false,
    profileImg: `https://picsum.photos/id/242/200/200`,
  },
  {
    id: '7',
    name: 'Crong',
    audio: true,
    video: true,
    speaking: false,
    profileImg: `https://picsum.photos/id/243/200/200`,
  },
];

export const DUMMY_DATA = {
  page: 1,
  lastPage: 2,
  membersPerPage: 6,
  totalMemberCount: 7,
  members: DUMMY_MEMBERS,
};

type TextChat = {
  type: 'TEXT';
  text: string;
};

type ImageChat = {
  type: 'IMAGE';
  src: string;
};

type FileChat = {
  type: 'FILE';
  fileName: string;
  size: number;
};

type ChatContent = TextChat | ImageChat | FileChat;

interface ChatListItemProps {
  id: string;
  name: string;
  profileImg: string;
  createdAt: string;
  content: ChatContent;
}

export const DUMMY_CHATS: ChatListItemProps[] = [
  {
    id: 'chat-1',
    name: 'Tony',
    profileImg: 'https://picsum.photos/id/237/200/200',
    createdAt: '2026-01-06T10:00:00Z',
    content: { type: 'TEXT', text: '안녕하세요! 다들 회의 준비 되셨나요?' },
  },
  {
    id: 'chat-2',
    name: 'Logan',
    profileImg: 'https://picsum.photos/id/238/200/200',
    createdAt: '2026-01-06T10:01:15Z',
    content: { type: 'TEXT', text: '네, 저 와있습니다. 바로 시작하시죠.' },
  },
  {
    id: 'chat-3',
    name: 'Andrew',
    profileImg: 'https://picsum.photos/id/239/200/200',
    createdAt: '2026-01-06T10:02:10Z',
    content: { type: 'IMAGE', src: 'https://picsum.photos/id/244/400/400' },
  },
  {
    id: 'chat-4',
    name: 'Andrew',
    profileImg: 'https://picsum.photos/id/239/200/200',
    createdAt: '2026-01-06T10:02:30Z',
    content: {
      type: 'TEXT',
      text: '방금 캡처한 화면인데, 이 부분 레이아웃이 좀 깨지는 것 같아요.',
    },
  },
  {
    id: 'chat-5',
    name: 'Lisey',
    profileImg: 'https://picsum.photos/id/240/200/200',
    createdAt: '2026-01-06T10:03:45Z',
    content: {
      type: 'TEXT',
      text: '아, 확인했습니다. 오늘 회의 기획안 먼저 공유드릴게요.',
    },
  },
  {
    id: 'chat-6',
    name: 'Lisey',
    profileImg: 'https://picsum.photos/id/240/200/200',
    createdAt: '2026-01-06T10:04:00Z',
    content: { type: 'FILE', fileName: '2026_Meeting_Plan.pdf', size: 1240000 },
  },
  {
    id: 'chat-7',
    name: 'Kuma',
    profileImg: 'https://picsum.photos/id/241/200/200',
    createdAt: '2026-01-06T10:05:20Z',
    content: {
      type: 'TEXT',
      text: '파일 확인했습니다! 2페이지 내용 위주로 보면 될까요?',
    },
  },
  {
    id: 'chat-8',
    name: 'Robert John Downey Junior',
    profileImg: 'https://picsum.photos/id/242/200/200',
    createdAt: '2026-01-06T10:06:10Z',
    content: {
      type: 'TEXT',
      text: '좋습니다. 다들 들어오신 김에 백엔드 로그 파일도 봐주세요.',
    },
  },
  {
    id: 'chat-9',
    name: 'Robert John Downey Junior',
    profileImg: 'https://picsum.photos/id/242/200/200',
    createdAt: '2026-01-06T10:06:25Z',
    content: { type: 'FILE', fileName: 'server_log_error.zip', size: 4500000 },
  },
  {
    id: 'chat-10',
    name: 'Crong',
    profileImg: 'https://picsum.photos/id/243/200/200',
    createdAt: '2026-01-06T10:07:05Z',
    content: { type: 'TEXT', text: '로그 분석 중입니다. 잠시만요.' },
  },
  {
    id: 'chat-11',
    name: 'Tony',
    profileImg: 'https://picsum.photos/id/237/200/200',
    createdAt: '2026-01-06T10:08:40Z',
    content: { type: 'IMAGE', src: 'https://picsum.photos/id/247/800/600' },
  },
  {
    id: 'chat-12',
    name: 'Tony',
    profileImg: 'https://picsum.photos/id/237/200/200',
    createdAt: '2026-01-06T10:08:55Z',
    content: {
      type: 'TEXT',
      text: '이건 참고용 디자인 레퍼런스 이미지입니다.',
    },
  },
  {
    id: 'chat-13',
    name: 'Logan',
    profileImg: 'https://picsum.photos/id/238/200/200',
    createdAt: '2026-01-06T10:10:00Z',
    content: { type: 'TEXT', text: '오, 이 레퍼런스 깔끔하고 좋네요.' },
  },
  {
    id: 'chat-14',
    name: 'Kuma',
    profileImg: 'https://picsum.photos/id/241/200/200',
    createdAt: '2026-01-06T10:11:20Z',
    content: { type: 'TEXT', text: '동감입니다. 바로 개발 들어가도 되겠어요.' },
  },
  {
    id: 'chat-15',
    name: 'Crong',
    profileImg: 'https://picsum.photos/id/243/200/200',
    createdAt: '2026-01-06T10:12:45Z',
    content: { type: 'FILE', fileName: 'final_assets.rar', size: 15800000 },
  },
];

export const DUMMY_MEETING_INFO = {
  id: 'ha8owf-h9afoh-3tojns',
  host: 'Tony',
  password: '1234',
};
