import MeetingMenu from '@/components/meeting/MeetingMenu';
import MemberVideoBar from '@/components/meeting/MemberVideoBar';

export default function MeetingPage() {
  return (
    <main className="flex h-screen w-screen flex-col bg-neutral-900">
      <MemberVideoBar />

      {/* 워크스페이스 / 코드 에디터 등의 컴포넌트가 들어갈 공간 */}
      <section className="flex-1"></section>

      <MeetingMenu />
    </main>
  );
}
