import ParticipateMeetingForm from '@/components/landing/ParticipateMeetingForm';
import StartMeetingButton from '@/components/landing/StartMeetingButton';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-90 flex-col gap-16 px-6 py-4">
        <section
          className="flex flex-col items-center gap-8"
          aria-labelledby="start-meeting-title"
        >
          <h2
            id="start-meeting-title"
            className="text-2xl font-bold text-neutral-900"
          >
            새 회의 시작
          </h2>
          <StartMeetingButton />
        </section>

        {/* 구분선 */}
        <div
          className="flex w-full items-center gap-4 text-neutral-500"
          aria-hidden
        >
          <span className="h-px flex-1 bg-neutral-500" />
          <span className="text-sm font-bold">또는</span>
          <span className="h-px flex-1 bg-neutral-500" />
        </div>

        <section
          className="flex flex-col items-center gap-6"
          aria-labelledby="join-meeting-title"
        >
          <h2
            id="join-meeting-title"
            className="text-2xl font-bold text-neutral-900"
          >
            회의 참여하기
          </h2>

          <ParticipateMeetingForm />
        </section>
      </div>
    </main>
  );
}
