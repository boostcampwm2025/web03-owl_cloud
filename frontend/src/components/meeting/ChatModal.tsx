import { CloseIcon } from '@/assets/icons/common';
import { FileIcon, SendIcon } from '@/assets/icons/meeting';
import ChatListItem from '@/components/meeting/ChatListItem';
import { useChatSender } from '@/hooks/chat/useChatSender';
import { useFileUpload } from '@/hooks/chat/useFileUpload';
import { useChatStore } from '@/store/useChatStore';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import { mapRecvPayloadToChatMessage } from '@/utils/chat';
import { formatFileSize } from '@/utils/formatter';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ToastMessage from '../common/ToastMessage';

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

  const { uploadFile, uploading, percent } = useFileUpload(socket);

  const checkIsNearBottom = () => {
    const container = scrollRef.current;
    if (!container) return false;

    const threshold = 150;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  // 사용자가 직접 스크롤할 때 호출되는 함수
  const handleScroll = () => {
    if (!showScrollBtn) return;

    if (checkIsNearBottom()) {
      if (showScrollBtn) setScrollBtn(false);
    }
  };

  // 파일 선택 핸들러
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const oversizedFiles = selectedFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 3000);
    }

    const validFiles = selectedFiles.filter((f) => f.size <= MAX_FILE_SIZE);

    // 만약 모든 파일이 용량 초과라면 여기서 초기화
    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    const newFiles = validFiles.map((file) => {
      const isImageOrVideo =
        file.type.startsWith('image/') || file.type.startsWith('video/');

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      let mediaType: PendingFile['mediaType'] = 'file';
      if (isImage) mediaType = 'image';
      else if (isVideo) mediaType = 'video';

      return {
        file,
        mediaType,
        id: Math.random().toString(36).substring(7),
        // 미리보기 URL 생성
        preview: isImageOrVideo ? URL.createObjectURL(file) : undefined,
      };
    });

    setPendingFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const onCloseClick = () => setIsOpen('isChatOpen', false);

  // 메시지 수신 시 스크롤 처리
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;

    if (isFirstRender.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isFirstRender.current = false;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage.userId === userId;

    const threshold = 150;
    const isNearBottom =
      scrollRef.current.scrollHeight -
        scrollRef.current.scrollTop -
        scrollRef.current.clientHeight <
      threshold;

    if (isMyMessage || isNearBottom) {
      // 스크롤 이동 -> DOM 직접 조작은 cascading render를 유발하지 않음
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: isMyMessage ? 'auto' : 'smooth',
      });
      if (showScrollBtn) setScrollBtn(false);
    } else {
      setScrollBtn(true);
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

      for (const item of filesToUpload) {
        try {
          const res = await uploadFile(item.file);

          if (res) {
            // 서버 응답 데이터를 채팅 메시지 객체로 변환
            const newMessage = mapRecvPayloadToChatMessage(res);
            useChatStore.getState().addMessage(newMessage);

            setPendingFiles((prev) => prev.filter((f) => f.id !== item.id));
          }
        } catch (err) {
          console.error(`${item.file.name} 업로드에 실패했습니다.`);
        }
      }
      setPendingFiles([]);
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

  const removePendingFiles = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview); // 메모리 해제
      return prev.filter((f) => f.id !== id);
    });
  };

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
        className="chat-scrollbar flex-1 overflow-y-auto scroll-smooth"
      >
        {messages.map((chat) => (
          <ChatListItem
            key={chat.id}
            {...chat}
            onImageLoad={() => {
              if (!checkIsNearBottom()) return;
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }}
          />
        ))}

        {showScrollBtn && (
          <button
            onClick={() => {
              scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
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
          <div className="flex flex-wrap gap-3 bg-neutral-700/50 p-3">
            {pendingFiles.map((f, idx) => {
              const containerClass =
                f.mediaType === 'file' ? 'w-full' : 'w-fit';
              return (
                <div key={f.id} className={`group relative ${containerClass}`}>
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
                  {uploading && idx === 0 && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60">
                      <span className="mb-1 text-[10px] font-bold text-white">
                        {percent}%
                      </span>
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-neutral-600">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percent}%` }}
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
              disabled={uploading}
              className="rounded-sm p-1 hover:bg-neutral-600"
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
