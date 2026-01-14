import Button from '@/components/common/button';
import Link from 'next/link';
import KakaoLoginButton from '@/components/auth/KakaoLoginButton';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-90 flex-col gap-16 px-6 py-4">
        <section
          className="flex flex-col items-center gap-8"
          aria-labelledby="local-login"
        >
          <h2
            id="start-meeting-title"
            className="text-2xl font-bold text-neutral-900"
          >
            로그인
          </h2>
          <form className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-4">
              <input
                id="meeting-code"
                placeholder="아이디를 입력해주세요"
                className="w-full rounded-sm border border-neutral-300 px-2 py-3 text-base outline-none focus:border-sky-600"
              />
              <input
                id="meeting-code"
                placeholder="비밀번호를 입력해주세요"
                className="w-full rounded-sm border border-neutral-300 px-2 py-3 text-base outline-none focus:border-sky-600"
              />
            </div>

            <div className="flex flex-col gap-4">
              <Button type="submit">로그인</Button>
              <Button type="button" color="outlinePrimary">
                <Link href="/sign-up">회원가입</Link>
              </Button>
            </div>
          </form>
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
          className="flex flex-col items-center gap-4"
          aria-labelledby="oauth-login"
        >
          <KakaoLoginButton />
          <GoogleLoginButton />
        </section>
      </div>
    </main>
  );
}
