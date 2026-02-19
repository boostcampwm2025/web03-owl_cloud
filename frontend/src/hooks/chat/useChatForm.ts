import { useState, useRef, useCallback, useMemo } from 'react';
import { useFileUpload } from '@/hooks/chat/useFileUpload';
import { useChatSender } from '@/hooks/chat/useChatSender';
import { mapRecvPayloadToChatMessage } from '@/utils/chat';
import { Socket } from 'socket.io-client';
import { useAddMessage } from '@/store/useChatStore';

type PendingFile = {
  file: File;
  id: string;
  preview?: string;
  mediaType: 'image' | 'video' | 'file';
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const useChatForm = (
  socket: Socket | null,
  userId: string,
  nickname: string,
  profilePath: string,
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sizeErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [hasValue, setHasValue] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showSizeError, setShowSizeError] = useState(false);

  const addMessage = useAddMessage();
  const { sendMessage: sendTextMessage } = useChatSender({
    socket,
    userId,
    nickname,
    profileImg: profilePath,
  });
  const { uploadFile, progressMap, uploadingMap } = useFileUpload(socket);

  // 파일 추가/삭제 로직
  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const oversizedFiles = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setShowSizeError(true);
      if (sizeErrorTimerRef.current) {
        clearTimeout(sizeErrorTimerRef.current);
      }
      sizeErrorTimerRef.current = setTimeout(
        () => setShowSizeError(false),
        3000,
      );
    }

    const validFiles = files.filter((f) => f.size <= MAX_FILE_SIZE);
    if (validFiles.length === 0) return;

    const newFiles = validFiles.map((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      let mediaType: PendingFile['mediaType'] = 'file';
      if (isImage) mediaType = 'image';
      else if (isVideo) mediaType = 'video';

      return {
        file,
        mediaType,
        id: crypto.randomUUID(),
        // 미리보기 URL 생성
        preview: isImage || isVideo ? URL.createObjectURL(file) : undefined,
      };
    });

    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // 파일 삭제 및 메모리 해제용
  const clearFilePreview = (file: PendingFile) => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) clearFilePreview(target);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const textValue = textareaRef.current?.value.trim();
    if (!textValue && pendingFiles.length === 0) return;

    if (textValue) {
      sendTextMessage(textValue);

      if (textareaRef.current) {
        textareaRef.current.value = '';
        textareaRef.current.style.height = 'auto'; // 전송하고 높이 초기화
        setHasValue(false);
      }
    }

    if (pendingFiles.length > 0) {
      const filesToUpload = [...pendingFiles];

      await Promise.all(
        filesToUpload.map(async (item) => {
          try {
            const res = await uploadFile(item.file, item.id);
            if (res) {
              // 서버 응답 데이터를 채팅 메시지 객체로 변환
              const newMessage = mapRecvPayloadToChatMessage(res);
              addMessage(newMessage);
              clearFilePreview(item); // 성공하면 메모리 해제

              // 여기서 펜딩애들 제거
              setPendingFiles((prev) => prev.filter((f) => f.id !== item.id));
            }
          } catch {
            console.error(`${item.file.name} 업로드에 실패했습니다.`);
          }
        }),
      );
    }
  };

  const isUploading = useMemo(
    () => Object.values(uploadingMap).some(Boolean),
    [uploadingMap],
  );

  return {
    textareaRef,
    sizeErrorTimerRef,
    pendingFiles,
    hasValue,
    showSizeError,
    setHasValue,
    addFiles,
    removeFile,
    handleSubmit,
    uploadingMap,
    progressMap,
    isUploading,
  };
};
