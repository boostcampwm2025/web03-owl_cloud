import Button from '@/components/common/button';

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
            className="text-[24px] font-bold text-neutral-900"
          >
            새 회의 시작
          </h2>
          <Button>시작하기</Button>
        </section>

        {/* 구분선 */}
        <div
          className="flex w-full items-center gap-4 text-neutral-500"
          aria-hidden
        >
          <span className="h-px flex-1 bg-neutral-500" />
          <span className="text-[14px] font-bold">또는</span>
          <span className="h-px flex-1 bg-neutral-500" />
        </div>

        <section
          className="flex flex-col items-center gap-8"
          aria-labelledby="join-meeting-title"
        >
          <h2
            id="join-meeting-title"
            className="text-[24px] font-bold text-neutral-900"
          >
            회의 참여하기
          </h2>

          <form className="flex w-full flex-col gap-6">
            <label htmlFor="meeting-code" className="sr-only">
              회의 코드 또는 링크
            </label>

            <input
              id="meeting-code"
              placeholder="코드 또는 링크를 입력해주세요"
              className="focus:border-primary-sky1 h-11 w-full rounded-sm border border-neutral-300 px-3 outline-none"
            />

            <Button type="submit">참여하기</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
