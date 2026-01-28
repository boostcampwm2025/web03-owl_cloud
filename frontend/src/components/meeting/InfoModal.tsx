'use client';

import { CopyIcon, EditIcon } from '@/assets/icons/common';
import Modal from '@/components/common/Modal';
import ToastMessage from '@/components/common/ToastMessage';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useEffect, useState } from 'react';

export default function InfoModal({ meetingId }: { meetingId: string }) {
  const { setIsOpen, meetingInfo, setMeetingInfo } = useMeetingStore();
  const [currentModal, setCurrentModal] = useState<
    'INFO' | 'PASSWORD' | 'PASSWORD_ERROR'
  >('INFO');
  const [value, setValue] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const onModalClose = () => setIsOpen('isInfoOpen', false);

  const onCodeCopyClick = () => {
    navigator.clipboard.writeText(meetingId);
    setHasCopied(true);
  };

  // 클립보드 복사 시 토스트 메세지 1.5초간 표시
  useEffect(() => {
    if (!hasCopied) return;
    const timer = setTimeout(() => setHasCopied(false), 1500);

    return () => clearTimeout(timer);
  }, [hasCopied]);

  const onPasswordChangeClick = () => {
    setCurrentModal((prev) => (prev === 'PASSWORD' ? 'INFO' : 'PASSWORD'));
  };

  const onPasswordConfirm = (password: string) => {
    try {
      if (password.trim()) {
        // 비밀번호 API 호출

        setMeetingInfo({ has_password: true });
      } else {
        setMeetingInfo({ has_password: false });
      }
    } catch {
      setCurrentModal('INFO');
    }
    setCurrentModal('INFO');
  };

  return (
    <>
      {currentModal === 'INFO' && (
        <Modal title="회의 정보" cancelText="확인" onCancel={onModalClose}>
          <ul className="flex flex-col gap-2">
            <li className="flex flex-col gap-1 px-2 py-1">
              <span className="text-sm text-neutral-200">회의명</span>
              <span className="font-bold text-neutral-50">
                {meetingInfo.title}
              </span>
            </li>

            <li className="flex flex-col gap-1 px-2 py-1">
              <span className="text-sm text-neutral-200">호스트</span>
              <span className="font-bold text-neutral-50">
                {meetingInfo.host_nickname}
              </span>
            </li>

            <li
              className="flex w-full cursor-pointer flex-col gap-1 overflow-hidden rounded-sm px-2 py-1 hover:bg-neutral-500"
              onClick={onCodeCopyClick}
            >
              <span className="text-sm text-neutral-200">회의 코드</span>
              <div className="flex w-full items-center gap-2 overflow-hidden">
                <span className="w-full text-left font-bold text-neutral-50">{`${meetingId}`}</span>
                <CopyIcon className="h-5 w-5 shrink-0 text-neutral-200" />
              </div>
            </li>

            <li
              className="flex w-full cursor-pointer flex-col gap-1 overflow-hidden rounded-sm px-2 py-1 hover:bg-neutral-500"
              onClick={onPasswordChangeClick}
            >
              <span className="text-sm text-neutral-200">비밀번호</span>
              <div className="flex w-full items-center gap-2 overflow-hidden">
                <span className="w-full text-left font-bold text-neutral-50">
                  {meetingInfo.has_password ? '••••' : '없음'}
                </span>
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

      {currentModal === 'PASSWORD_ERROR' && (
        <Modal
          title="비밀번호 변경 실패"
          cancelText="확인"
          onCancel={() => setCurrentModal('INFO')}
        >
          {'비밀번호 변경 중 문제가 발생했습니다\n다시 시도해주세요'}
        </Modal>
      )}
    </>
  );
}
