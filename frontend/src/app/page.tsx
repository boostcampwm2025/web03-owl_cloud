import ParticipateMeetingForm from '@/components/landing/ParticipateMeetingForm';
import StartMeetingButton from '@/components/landing/StartMeetingButton';
import Header from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="mt-16 flex flex-1 items-center justify-center px-20">
        <div className="flex w-full max-w-350 gap-2">
          <section className="flex w-full flex-col items-center justify-center">
            <h1 className="mb-6 text-8xl font-extrabold tracking-tighter text-neutral-700">
              <span className="text-[#0084D1]">dev:</span>meet
            </h1>

            <p className="max-w-md text-center text-lg leading-relaxed font-medium text-neutral-400">
              개발자를 위한 실시간 그룹 화상 회의 서비스
            </p>
          </section>

          <section className="flex w-full justify-center">
            <div className="flex w-full max-w-md flex-col gap-14 rounded-2xl border border-neutral-200 bg-white p-12 shadow-sm">
              <section
                className="flex flex-col items-center gap-6"
                aria-labelledby="start-meeting-title"
              >
                <h2
                  id="start-meeting-title"
                  className="text-xl font-bold text-neutral-900"
                >
                  새 회의 시작
                </h2>
                <StartMeetingButton />
              </section>

              <div
                className="flex w-full items-center gap-4 text-neutral-400"
                aria-hidden
              >
                <span className="h-px flex-1 bg-neutral-300" />
                <span className="text-sm font-semibold">또는</span>
                <span className="h-px flex-1 bg-neutral-300" />
              </div>

              <section
                className="flex flex-col items-center gap-6"
                aria-labelledby="join-meeting-title"
              >
                <h2
                  id="join-meeting-title"
                  className="text-xl font-bold text-neutral-900"
                >
                  회의 참여하기
                </h2>
                <ParticipateMeetingForm />
              </section>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
