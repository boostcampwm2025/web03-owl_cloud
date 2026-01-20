'use client';

import { DUMMY_MEETING_INFO } from '@/app/[meetingId]/dummy';
import {
  CopyIcon,
  EditIcon,
  EyeOffIcon,
  EyeOnIcon,
} from '@/assets/icons/common';
import Modal from '@/components/common/Modal';
import ToastMessage from '@/components/common/ToastMessage';
import { useMeetingStore } from '@/store/useMeetingStore';
import { hidePassword } from '@/utils/security';
import { MouseEvent, useEffect, useState } from 'react';

export default function InfoModal() {
  const { id, host, password } = DUMMY_MEETING_INFO;

  const { setIsOpen } = useMeetingStore();
  const [currentPassword, setCurrentPassword] = useState(password || '');
  const [currentModal, setCurrentModal] = useState<'INFO' | 'PASSWORD'>('INFO');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [value, setValue] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const onModalClose = () => setIsOpen('isInfoOpen', false);

  const onCodeCopyClick = () => {
    navigator.clipboard.writeText(id);
    setHasCopied(true);
  };

  // 클립보드 복사 시 토스트 메세지 1.5초간 표시
  useEffect(() => {
    if (!hasCopied) return;
    const timer = setTimeout(() => setHasCopied(false), 1500);

    return () => clearTimeout(timer);
  }, [hasCopied]);

  const onPasswordHideClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsPasswordHidden((prev) => !prev);
  };

  const onPasswordChangeClick = () => {
    setValue(currentPassword);
    setCurrentModal((prev) => (prev === 'PASSWORD' ? 'INFO' : 'PASSWORD'));
  };

  const onPasswordConfirm = (password: string) => {
    setCurrentPassword(password);
    setIsPasswordHidden(true);
    setCurrentModal('INFO');
  };

  return (
    <>
      {currentModal === 'INFO' && (
        <Modal title="회의 정보" cancelText="확인" onCancel={onModalClose}>
          <ul className="flex flex-col gap-2">
            <li className="flex flex-col gap-1 px-2 py-1">
              <span className="text-sm text-neutral-200">호스트</span>
              <span className="font-bold text-neutral-50">{host}</span>
            </li>

            <li
              className="flex w-full cursor-pointer flex-col gap-1 overflow-hidden rounded-sm px-2 py-1 hover:bg-neutral-500"
              onClick={onCodeCopyClick}
            >
              <span className="text-sm text-neutral-200">회의 코드</span>
              <div className="flex w-full items-center gap-2 overflow-hidden">
                <span className="w-full text-left font-bold text-neutral-50">{`${id}`}</span>
                <CopyIcon className="h-5 w-5 shrink-0 text-neutral-200" />
              </div>
            </li>

            {/* 토큰 관련 로직 구현 후 호스트만 보이게 수정 필요 */}
            <li
              className="flex w-full cursor-pointer flex-col gap-1 overflow-hidden rounded-sm px-2 py-1 hover:bg-neutral-500"
              onClick={onPasswordChangeClick}
            >
              <span className="text-sm text-neutral-200">비밀번호</span>
              <div className="flex w-full items-center gap-2 overflow-hidden">
                <span className="w-full text-left font-bold text-neutral-50">
                  {currentPassword
                    ? isPasswordHidden
                      ? hidePassword(currentPassword)
                      : currentPassword
                    : '없음'}
                </span>
                <button onClick={onPasswordHideClick}>
                  {currentPassword &&
                    (isPasswordHidden ? (
                      <EyeOnIcon className="h-5 w-5 text-neutral-200" />
                    ) : (
                      <EyeOffIcon className="h-5 w-5 text-neutral-200" />
                    ))}
                </button>
                <EditIcon className="h-5 w-5 shrink-0 text-neutral-200" />
              </div>
            </li>
          </ul>

          {hasCopied && (
            <ToastMessage message="클립보드에 코드가 복사되었습니다" />
          )}
        </Modal>
      )}

      {currentModal === 'PASSWORD' && (
        <Modal
          title="비밀번호 변경"
          cancelText="취소"
          onCancel={onPasswordChangeClick}
          confirmText="확인"
          onConfirm={() => onPasswordConfirm(value)}
        >
          <input
            type="password"
            className="w-full rounded-sm bg-neutral-700 px-2 py-3 text-neutral-50 focus:outline-none"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Modal>
      )}
    </>
  );
}
