'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/common/button';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const title = searchParams.get('title') ?? '알 수 없는 에러';
  const status = searchParams.get('status') ?? '500';
  const message =
    searchParams.get('message') ?? '예기치 못한 오류가 발생했습니다.';

  const onClick = () => router.replace('/');

  return (
    <div className="flex w-full max-w-90 flex-col gap-8 px-6 py-4">
      <section className="flex flex-col items-center gap-4">
        <h1 className="section-title">{title}</h1>
        <span className="text-center whitespace-pre-wrap text-neutral-600">
          {`상태 코드: ${status}\n${message}`}
        </span>
      </section>
      <Button onClick={onClick}>홈으로</Button>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="flex-center min-h-dvh w-screen">
      <Suspense fallback={<></>}>
        <ErrorContent />
      </Suspense>
    </main>
  );
}
