'use client';

import Button from '@/components/common/button';
import { parseRoomPath } from '@/utils/formatter';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef } from 'react';

export default function ParticipateMeetingForm() {
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const value = inputRef.current?.value;
    if (value) {
      const path = parseRoomPath(value);
      router.push(path);
    }
  };

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={onSubmit}>
      <label htmlFor="meeting-code" className="sr-only">
        회의 코드 또는 링크
      </label>

      <input
        ref={inputRef}
        id="meeting-code"
        placeholder="코드 또는 링크를 입력해주세요"
        className="input-default input-light border-neutral-400! text-neutral-100!"
      />

      <Button type="submit">참여하기</Button>
    </form>
  );
}
