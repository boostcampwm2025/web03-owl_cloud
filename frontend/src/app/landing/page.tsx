import Button from '@/components/common/button';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <section
        className="m-auto flex w-full max-w-90 flex-col gap-16 px-6 py-4"
        aria-labelledby="start-meeting-title"
      >
        <header className="flex flex-col items-center gap-8">
          <h1
            id="start-meeting-title"
            className="text-[24px] font-bold text-neutral-900"
          >
            새 회의 시작
          </h1>
          <Button>시작하기</Button>
        </header>

        {/* 구분선 */}
        <div
          className="flex w-full items-center gap-4 text-neutral-500"
          aria-hidden
        >
          <span className="h-px flex-1 bg-neutral-500" />
          <span className="text-[14px] font-bold">또는</span>
          <span className="h-px flex-1 bg-neutral-500" />
        </div>

        <section aria-labelledby="join-meeting-title">
          <h2
            id="join-meeting-title"
            className="mb-8 text-center text-[24px] font-bold text-neutral-900"
          >
            회의 참여하기
          </h2>

          <form className="flex flex-col gap-6">
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
      </section>
    </main>
  );
}
