import { CloseIcon } from '@/assets/icons/common';
import { FileIcon, SendIcon } from '@/assets/icons/meeting';
import ToastMessage from '@/components/common/ToastMessage';
import { useChatSender } from '@/hooks/chat/useChatSender';
import { useFileUpload } from '@/hooks/chat/useFileUpload';
import { useChatStore } from '@/store/useChatStore';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import { isSameMinute, mapRecvPayloadToChatMessage } from '@/utils/chat';
import { formatFileSize } from '@/utils/formatter';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatListItem } from './ChatListItem';
import { useChatScroll } from '@/hooks/chat/useChatScroll';

type PendingFile = {
  file: File;
  id: string;
  preview?: string;
  mediaType: 'image' | 'video' | 'file';
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function ChatModal() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  const { setIsOpen } = useMeetingStore();

  const [hasValue, setHasValue] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showSizeError, setShowSizeError] = useState(false);
  const [showScrollBtn, setScrollBtn] = useState<boolean>(false);

  const { userId, nickname, profilePath } = useUserStore();
  const messages = useChatStore((s) => s.messages);
  const socket = useMeetingSocketStore((s) => s.socket);

  const { sendMessage: sendTextMessage } = useChatSender({
    socket,
    userId,
    nickname,
    profileImg: profilePath as string,
  });

  const { uploadFile, progressMap, uploadingMap } = useFileUpload(socket);

  const { handleScroll, scrollToBottom, isAtBottomRef } =
    useChatScroll(scrollRef);

  const addFilesToPending = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const oversizedFiles = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 3000);
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

  // 파일 선택 핸들러
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFilesToPending(selectedFiles);
    e.target.value = '';
  };

  // 파일 삭제 및 메모리 해제용
  const clearFilePreview = (file: PendingFile) => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
  };

  const removePendingFiles = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) clearFilePreview(target);
      return prev.filter((f) => f.id !== id);
    });
  };

  const onCloseClick = () => setIsOpen('isChatOpen', false);

  // 메시지 수신 시 스크롤 처리
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;

    if (isFirstRender.current) {
      scrollToBottom();
      isFirstRender.current = false;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage.userId === userId;

    const isImageMessage =
      lastMessage.content.type === 'file' &&
      lastMessage.content.category === 'image';

    // 이미지면 여기서 스크롤하지 않음
    if (isImageMessage) return;

    if (isMyMessage || isAtBottomRef.current) {
      scrollToBottom(isMyMessage);
      setScrollBtn((prev) => (prev !== false ? false : prev));
    } else {
      setScrollBtn((prev) => (prev !== true ? true : prev));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, userId]);

  // 이후 form 관련 라이브러리 사용 시 수정 필요
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const uploadPromises = filesToUpload.map(async (item) => {
        try {
          const res = await uploadFile(item.file, item.id);

          if (res) {
            // 서버 응답 데이터를 채팅 메시지 객체로 변환
            const newMessage = mapRecvPayloadToChatMessage(res);
            useChatStore.getState().addMessage(newMessage);

            clearFilePreview(item); // 성공하면 메모리 해제

            // 여기서 펜딩애들 제거
            setPendingFiles((prev) => prev.filter((f) => f.id !== item.id));
          }
        } catch (err) {
          console.error(`${item.file.name} 업로드에 실패했습니다.`);
        }
      });

      await Promise.all(uploadPromises);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  // textarea 자동 높이 조절
  const handleInput = () => {
    const obj = textareaRef.current;
    if (!obj) return;
    const maxHeight = 120;

    obj.style.height = 'auto';
    obj.style.height =
      obj.scrollHeight > maxHeight ? `${maxHeight}px` : `${obj.scrollHeight}px`;

    setHasValue(obj.value.trim().length > 0);
  };

  const handleImageLoad = useCallback((isMine: boolean) => {
    if (isAtBottomRef.current || isMine) {
      scrollToBottom(true);
    }
  }, []);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault(); // 이미지가 textarea에 base64로 들어가는 것 방지
      addFilesToPending(files);
    }
  };

  const isUploading = Object.values(uploadingMap).some(Boolean);

  return (
    <aside className="meeting-side-modal z-6">
      {showSizeError && (
        <ToastMessage message="100MB를 초과하는 파일은 업로드할 수 없습니다." />
      )}

      <div className="flex-center relative h-12 w-full bg-neutral-800">
        <span className="font-bold text-neutral-200">채팅</span>
        <button
          className="absolute top-2 right-2 rounded-sm p-1 hover:bg-neutral-700"
          onClick={onCloseClick}
        >
          <CloseIcon className="h-6 w-6 text-neutral-200" />
        </button>
      </div>

      {/* 채팅 내역 */}
      <section
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scrollbar flex-1 overflow-y-auto scroll-smooth pb-4"
      >
        {messages.map((chat, idx) => {
          const prevMsg = messages[idx - 1];

          const isDifferentUser = !prevMsg || prevMsg.userId !== chat.userId;
          const isDifferentTime =
            !prevMsg || !isSameMinute(chat.createdAt, prevMsg.createdAt);

          const showProfile = isDifferentUser || isDifferentTime;

          return (
            <ChatListItem
              key={chat.id}
              {...chat}
              showProfile={showProfile}
              onImageLoad={() => handleImageLoad(chat.userId === userId)}
            />
          );
        })}

        {showScrollBtn && (
          <button
            onClick={() => {
              scrollToBottom(true);
              setScrollBtn(false);
            }}
            className="absolute bottom-30 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-xs text-white shadow-lg"
          >
            새 메시지 보기 ↓
          </button>
        )}
      </section>

      {/* 채팅 입력 부분 */}
      <form
        className="flex flex-col border-t border-neutral-600"
        onSubmit={onSubmit}
      >
        {/* 파일 업로드 현황 */}
        {pendingFiles.length > 0 && (
          <div className="horizon-scrollbar flex gap-3 overflow-x-auto overflow-y-hidden bg-neutral-700/50 p-3">
            {pendingFiles.map((f) => {
              const containerClass =
                f.mediaType === 'file' ? 'w-full' : 'w-fit';
              return (
                <div
                  key={f.id}
                  className={`group relative shrink-0 ${containerClass}`}
                >
                  {f.mediaType === 'image' && f.preview && (
                    <Image
                      src={f.preview}
                      width={64}
                      height={64}
                      alt="preview"
                      className="h-16 w-16 rounded-md border border-neutral-500 object-cover"
                      unoptimized
                    />
                  )}

                  {f.mediaType === 'video' && f.preview && (
                    <video
                      src={f.preview}
                      className="h-16 w-16 rounded-md border border-neutral-500 object-cover"
                      muted
                      playsInline
                    />
                  )}

                  {f.mediaType === 'file' && (
                    <div className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-500 bg-neutral-600 px-3 py-2">
                      <FileIcon className="h-6 w-6 text-neutral-300" />

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-left text-sm font-bold text-neutral-50">
                          {f.file.name}
                        </span>
                        <span className="text-xs text-neutral-300">
                          {formatFileSize(f.file.size)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 업로드 진행률 표시 */}
                  {uploadingMap[f.id] && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60">
                      <span className="mb-1 text-[10px] font-bold text-white">
                        {progressMap[f.id]}%
                      </span>
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-neutral-600">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${progressMap[f.id]}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => removePendingFiles(f.id)}
                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-500 text-neutral-200 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 텍스트 input */}
        <textarea
          ref={textareaRef}
          className="peer chat-scrollbar max-h-30 w-full resize-none overflow-y-auto px-2 pt-3 pb-1 text-sm text-neutral-50 placeholder:text-neutral-400 focus:outline-none"
          placeholder="메세지를 입력해주세요"
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onPaste={handlePaste}
        />

        {/* 버튼 */}
        <div className="flex justify-between p-2 text-neutral-200 peer-placeholder-shown:text-neutral-400">
          {/* 이미지, 파일 로직 추가 후 수정 필요 */}
          <div className="flex gap-1 text-neutral-200">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={onFileChange}
            />

            <button
              type="button"
              disabled={isUploading}
              className="rounded-sm p-1 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = '*/*';
                  fileInputRef.current.click();
                }
              }}
            >
              <FileIcon />
            </button>
          </div>
          <button
            type="submit"
            disabled={!hasValue && pendingFiles.length === 0}
            className={`rounded-sm p-1 ${
              hasValue || pendingFiles.length > 0
                ? 'cursor-pointer text-neutral-200 hover:bg-neutral-600'
                : 'cursor-default text-neutral-400 hover:bg-transparent'
            } `}
            onClick={onSubmit}
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
