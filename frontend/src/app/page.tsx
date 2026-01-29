import { LogoIcon } from '@/assets/icons/common';
import ParticipateMeetingForm from '@/components/landing/ParticipateMeetingForm';
import StartMeetingButton from '@/components/landing/StartMeetingButton';
import Header from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="flex w-full flex-1 items-center px-4 pt-16 max-md:justify-center">
        <div className="flex h-full w-full max-w-300 items-center py-12 max-md:flex-col max-md:justify-center max-md:gap-12 max-sm:gap-12 md:gap-4">
          <section className="flex w-full max-w-200 flex-col items-center justify-center gap-4">
            <LogoIcon
              className="h-16 w-auto max-md:h-12"
              width="100%"
              height="100%"
            />

            <p className="text-center text-lg leading-relaxed font-medium text-neutral-400">
              개발자를 위한 실시간 그룹 화상 회의 서비스
            </p>
          </section>

          <section className="flex w-full max-w-90 justify-center md:max-w-90">
            <div className="flex w-full flex-col gap-14 rounded-2xl border border-neutral-200 bg-white px-6 py-12 shadow-sm">
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
