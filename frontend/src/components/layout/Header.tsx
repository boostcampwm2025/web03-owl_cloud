'use client';

import { useUserStore } from '@/store/useUserStore';
import { apiWithToken } from '@/utils/apiClient';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface UserResponse {
  email: string;
  nickname: string;
  user_id: string;
  profile_path: string | null;
}

export default function Header() {
  const { nickname, isLoggedIn, isLoaded, setUser, setIsLoaded } =
    useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { email, nickname, user_id, profile_path } =
          await apiWithToken.get<UserResponse>('/auth/me');
        setUser({
          email,
          nickname,
          userId: user_id,
          profilePath: profile_path,
        });
      } catch {
        setIsLoaded();
      }
    };

    fetchUser();
  }, []);

  const [isProfileOpen, setProfileOpen] = useState(false);
  const onProfileClick = () => {
    setProfileOpen((prev) => !prev);
  };

  const logout = async () => {
    await apiWithToken.delete('/auth/logout');
    window.location.href = '/landing';
  };

  return (
    <header className="fixed top-0 left-0 flex h-16 w-screen items-center justify-between border-b border-neutral-200 px-6">
      <Link href="/landing">로고</Link>

      {isLoaded &&
        (isLoggedIn ? (
          <button
            className="relative h-10 w-10 rounded-full bg-neutral-200"
            onClick={onProfileClick}
          >
            <Image
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              src="https://picsum.photos/id/237/200/100"
              alt="프로필 사진"
            />

            {isProfileOpen && (
              <ul
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 z-10 mt-2 max-h-30 w-30 cursor-default overflow-y-auto rounded-sm border border-neutral-200 bg-white shadow"
              >
                <li className="px-3 py-2 text-sm font-bold">{nickname}</li>
                <li
                  onClick={logout}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-neutral-100"
                >
                  로그아웃
                </li>
              </ul>
            )}
          </button>
        ) : (
          <Link
            href="/login"
            className="flex h-10 items-center rounded-lg border border-sky-600 px-5 text-sm font-bold text-sky-600"
          >
            로그인
          </Link>
        ))}
    </header>
  );
}
