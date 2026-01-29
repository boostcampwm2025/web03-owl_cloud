import Modal from '@/components/common/Modal';
import { useUserStore } from '@/store/useUserStore';
import { MeetingForm } from '@/types/forms';
import { apiWithToken } from '@/utils/apiClient';
import {
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  validateMeetingForm,
} from '@/utils/validate';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useState } from 'react';

interface RoomsResponse {
  code: string;
}

export default function MeetingFormModal({
  closeModal,
}: {
  closeModal: () => void;
}) {
  const router = useRouter();

  const { nickname } = useUserStore();
  const [formData, setFormData] = useState<MeetingForm>({
    max_participants: 1,
    title: `${nickname} 님의 회의실`,
    password: '',
  });
  const [isError, setIsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: keyof MeetingForm,
  ) => {
    if (type === 'max_participants') {
      // 숫자 입력값을 최대 ~ 최소값으로 제한
      const newValue = Math.max(
        MIN_PARTICIPANTS,
        Math.min(Number(e.target.value), MAX_PARTICIPANTS),
      );
      setFormData((prev) => ({ ...prev, max_participants: newValue }));
    } else {
      setFormData((prev) => ({ ...prev, [type]: e.target.value }));
    }
  };

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      const { ok, message } = validateMeetingForm(formData);
      if (!ok) {
        setIsError(message || '다시 시도해주세요');
        setIsLoading(false);
        return;
      }

      const { password } = formData;
      const body: MeetingForm = {
        ...formData,
        password: password && password.trim().length > 0 ? password : undefined,
      };

      const { code } = await apiWithToken.post<RoomsResponse>('/rooms', body);
      router.push(`/${code}`);
    } catch {
      setIsError('예상치 못한 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return !isError ? (
    !isLoading ? (
      <Modal
        title="회의 생성"
        cancelText="취소"
        onCancel={closeModal}
        confirmText="생성"
        onConfirm={onSubmit}
        isLightMode
      >
        <form className="flex flex-col gap-3 px-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm">최대 인원 (1~100)</label>
            <input
              className="input-light input-sm"
              type="number"
              value={formData.max_participants}
              onChange={(e) => onInputChange(e, 'max_participants')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm">회의명 (최대 100자)</label>
            <input
              className="input-light input-sm"
              value={formData.title}
              onChange={(e) => onInputChange(e, 'title')}
              placeholder="회의명을 입력해주세요"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm">비밀번호 (6~16자)</label>
            <input
              className="input-light input-sm"
              type="password"
              value={formData.password}
              onChange={(e) => onInputChange(e, 'password')}
              placeholder="(선택) 비밀번호를 입력해주세요"
            />
          </div>
        </form>
      </Modal>
    ) : (
      <div className="flex-center fixed top-0 left-0 z-50 h-screen w-screen bg-neutral-900/30 px-4 py-4">
        <span
          className="flex-center rounded-lg border border-neutral-200 bg-white p-6 font-bold text-neutral-600"
          onClick={(e) => e.stopPropagation()}
        >
          회의를 생성 중입니다...
        </span>
      </div>
    )
  ) : (
    <Modal
      title="회의 생성 실패"
      cancelText="확인"
      onCancel={() => setIsError(null)}
      isLightMode
    >
      {isError}
    </Modal>
  );
}
