'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');

      if (accessToken) {
        sessionStorage.setItem('access_token', accessToken);
        router.replace('/');
      } else {
        router.replace('/auth/error');
      }
    }
  }, []);

  return <></>;
}
