import { validateMeetingForm } from '@/utils/validate';
import { MeetingForm } from '@/types/forms';

describe('회의 생성 Form Validation 테스트', () => {
  const baseForm: MeetingForm = {
    max_participants: 5,
    title: '테스트 회의',
    password: '123456',
  };

  it('모든 값이 정상 범위의 경계 안에 있으면 ok=true를 반환한다', () => {
    const result = validateMeetingForm(baseForm);

    expect(result.ok).toBe(true);
    expect(result.message).toBe('');
  });

  describe('참가 인원(max_participants) 경계값 테스트', () => {
    it('최소 허용 인원(1)은 유효하다', () => {
      const result = validateMeetingForm({
        ...baseForm,
        max_participants: 1,
      });

      expect(result.ok).toBe(true);
    });

    it('최대 허용 인원(100)은 유효하다', () => {
      const result = validateMeetingForm({
        ...baseForm,
        max_participants: 100,
      });

      expect(result.ok).toBe(true);
    });

    it('0명은 실패한다 (하한 경계 밖)', () => {
      const result = validateMeetingForm({
        ...baseForm,
        max_participants: 0,
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('최대 인원을 확인해주세요');
    });

    it('101명은 실패한다 (상한 경계 밖)', () => {
      const result = validateMeetingForm({
        ...baseForm,
        max_participants: 101,
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('최대 인원을 확인해주세요');
    });
  });

  describe('회의명(title) 경계값 테스트', () => {
    it('1자 제목은 유효하다', () => {
      const result = validateMeetingForm({
        ...baseForm,
        title: 'a',
      });

      expect(result.ok).toBe(true);
    });

    it('100자 제목은 유효하다', () => {
      const result = validateMeetingForm({
        ...baseForm,
        title: 'a'.repeat(100),
      });

      expect(result.ok).toBe(true);
    });

    it('빈 문자열은 실패한다', () => {
      const result = validateMeetingForm({
        ...baseForm,
        title: '',
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('회의명을 확인해주세요');
    });

    it('공백만 있는 문자열은 실패한다 (trim 경계)', () => {
      const result = validateMeetingForm({
        ...baseForm,
        title: '   ',
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('회의명을 확인해주세요');
    });

    it('101자 제목은 실패한다 (상한 경계 밖)', () => {
      const result = validateMeetingForm({
        ...baseForm,
        title: 'a'.repeat(101),
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('회의명을 확인해주세요');
    });
  });

  describe('비밀번호(password) 경계값 테스트', () => {
    it('비밀번호가 없으면 유효하다 (선택값)', () => {
      const result = validateMeetingForm({
        ...baseForm,
        password: '',
      });

      expect(result.ok).toBe(true);
    });

    it('최소 길이(6자)는 유효하다', () => {
      const result = validateMeetingForm({
        ...baseForm,
        password: '123456',
      });

      expect(result.ok).toBe(true);
    });

    it('최대 길이(16자)는 유효하다', () => {
      const result = validateMeetingForm({
        ...baseForm,
        password: 'a'.repeat(16),
      });

      expect(result.ok).toBe(true);
    });

    it('5자는 실패한다 (하한 경계 밖)', () => {
      const result = validateMeetingForm({
        ...baseForm,
        password: '12345',
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('비밀번호를 확인해주세요');
    });

    it('17자는 실패한다 (상한 경계 밖)', () => {
      const result = validateMeetingForm({
        ...baseForm,
        password: 'a'.repeat(17),
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('비밀번호를 확인해주세요');
    });
  });
});
