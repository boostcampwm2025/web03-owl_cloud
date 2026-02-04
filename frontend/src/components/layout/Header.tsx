'use client';

import { useUserStore } from '@/store/useUserStore';
import { apiWithToken } from '@/utils/apiClient';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogoIcon } from '@/assets/icons/common';
import ProfileImg from '@/components/common/ProfileImg';
import { useClickOutside } from '@/hooks/useClickOutside';

interface UserResponse {
  email: string;
  nickname: string;
  user_id: string;
  profile_path: string | null;
}

export default function Header() {
  const { nickname, isLoggedIn, isLoaded, setUser, setIsLoaded, profilePath } =
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
    window.location.href = '/';
  };

  const profileBtnRef = useRef<HTMLButtonElement | null>(null);
  useClickOutside(profileBtnRef, onProfileClick, isProfileOpen);

  return (
    <header className="fixed top-0 left-0 z-5 flex h-16 w-screen items-center justify-between border-b border-neutral-200 bg-white px-6">
      <Link href="/">
        <LogoIcon
          className="h-7.5 w-auto text-neutral-900"
          width="100%"
          height="100%"
        />
      </Link>

      {isLoaded &&
        (isLoggedIn ? (
          <button
            ref={profileBtnRef}
            className="relative h-10 w-10 rounded-full bg-neutral-200"
            onClick={onProfileClick}
          >
            <ProfileImg
              profilePath={profilePath}
              nickname={nickname}
              size={40}
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
