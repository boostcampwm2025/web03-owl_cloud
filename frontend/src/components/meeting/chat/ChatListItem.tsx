import { DownloadIcon, FileIcon } from '@/assets/icons/meeting';
import { useFileDownload } from '@/hooks/chat/useFileDownload';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { ChatMessage } from '@/types/chat';
import { formatFileSize, formatTimestamp } from '@/utils/formatter';
import Image from 'next/image';
import { memo, useCallback } from 'react';

export function ChatListItem({
  nickname,
  profileImg,
  createdAt,
  content,
  onImageLoad,
  showProfile,
}: ChatMessage & { onImageLoad?: () => void; showProfile: boolean }) {
  const socket = useMeetingSocketStore((s) => s.socket);
  const { downloadFile, downloadingId } = useFileDownload(socket);

  const isFile = content.type === 'file';
  const fileId = isFile ? content.fileId : null;
  const fileName = isFile ? content.filename : '';

  const isItemDownloading = isFile && downloadingId === content.fileId;

  const handleDownload = useCallback(() => {
    if (isFile && fileId) {
      downloadFile(fileId, fileName || 'download');
    }
  }, [isFile, fileId, fileName, downloadFile]);

  const isSvg = isFile && content.filename?.toLowerCase().endsWith('.svg');

  return (
    <div className={`flex w-full gap-3 px-4 ${showProfile ? 'mt-4' : 'mt-1'}`}>
      <div className="w-8 shrink-0">
        {showProfile ? (
          profileImg ? (
            <Image
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
              src={profileImg}
              alt={`${nickname}님의 프로필 사진`}
            />
          ) : (
            <div className="flex-center aspect-square h-8 w-8 rounded-full bg-neutral-500 text-sm font-bold text-neutral-50">
              {nickname[0]}
            </div>
          )
        ) : null}
      </div>

      <section className="flex flex-col gap-2">
        {/* 댓글 정보 */}
        {showProfile && (
          <div className="flex items-end gap-2">
            <span className="text-sm font-bold text-neutral-200">
              {nickname}
            </span>
            <span className="text-[10px] font-bold text-neutral-400">
              {formatTimestamp(createdAt)}
            </span>
          </div>
        )}

        {/* 댓글 내용 */}
        {!isFile && content.type === 'text' && (
          <span className="inline-flex self-start rounded-sm bg-neutral-600 p-2 text-sm break-all whitespace-pre-wrap text-neutral-50">
            {content.text}
          </span>
        )}

        {isFile && content.category === 'image' && (
          <span className="group relative rounded-sm bg-neutral-600 p-2">
            {isSvg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                width={400}
                height={300}
                src={content.fileUrl}
                alt={content.filename}
                className="h-auto w-full object-contain"
                onLoad={onImageLoad}
              />
            ) : (
              <Image
                width={400}
                height={300}
                className="h-auto w-full object-contain"
                src={content.fileUrl as string}
                alt={content.filename}
                onLoad={onImageLoad}
              />
            )}

            <button
              type="button"
              disabled={isItemDownloading}
              onClick={handleDownload}
              className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-200 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
          </span>
        )}

        {isFile && content.category === 'video' && (
          <span className="rounded-sm bg-neutral-600 p-2">
            <video
              controls
              preload="metadata"
              width={200}
              height={200}
              className="max-h-50 w-50 object-cover"
              src={content.fileUrl}
            />
          </span>
        )}

        {isFile &&
          (content.category === 'binary' || content.category === 'text') && (
            <div className="group flex items-center gap-4 rounded-sm bg-neutral-600 px-3 py-2">
              <a
                href={content.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-1 items-center gap-3"
                download
              >
                <FileIcon className="h-6 w-6 text-neutral-50" />

                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-left text-sm font-bold break-all whitespace-pre-wrap text-neutral-50">
                    {content.filename}
                  </span>
                  <span className="text-xs text-neutral-300">
                    {formatFileSize(content.size)}
                  </span>
                </div>
              </a>

              <button
                type="button"
                aria-label="파일 다운로드"
                onClick={handleDownload}
                className="rounded-full p-1 group-hover:bg-neutral-500"
              >
                <DownloadIcon className="h-6 w-6 text-neutral-50" />
              </button>
            </div>
          )}
      </section>
    </div>
  );
}

export default memo(ChatListItem);
