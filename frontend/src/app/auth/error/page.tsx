'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/common/button';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get('status');
  const message = searchParams.get('message');
  const onClick = () => router.replace('/');

  return (
    <div className="flex w-full max-w-90 flex-col gap-8 px-6 py-4">
      <section className="flex flex-col items-center gap-4">
        <h1 className="section-title">로그인 실패</h1>
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
    <main className="flex-center min-h-screen w-screen">
      <Suspense fallback={<></>}>
        <ErrorContent />
      </Suspense>
    </main>
  );
}
