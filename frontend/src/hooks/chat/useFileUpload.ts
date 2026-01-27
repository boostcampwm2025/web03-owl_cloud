import { FileCheckPayload, UploadTicket } from '@/types/chat';
import {
  emitAck,
  pickCategory,
  putToPresignedUrl,
  sliceFile,
} from '@/utils/chat';
import { useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';

export const useFileUpload = (socket: Socket | null) => {
  const [percent, setPercent] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);

  const requestUploadTicket = useCallback(
    async (file: File): Promise<UploadTicket> => {
      if (!socket?.connected) throw new Error('socket not connected');

      return emitAck(socket, 'signaling:ws:upload_file', {
        filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        category: pickCategory(file),
        size: file.size,
      });
    },
    [socket],
  );

  const fileCheck = useCallback(
    async (payload: FileCheckPayload) => {
      if (!socket?.connected) throw new Error('socket not connected');
      return emitAck(socket, 'signaling:ws:file_check', payload);
    },
    [socket],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!socket) return;

      setUploading(true);
      setPercent(0);

      try {
        const ticket = await requestUploadTicket(file);
        const { type, file_id, direct, multipart, multipart_resume } = ticket;
        let finalPayload: FileCheckPayload;

        const isMultipart = file.size > 10 * 1024 * 1024;

        // 이미 완료된 경우
        if (type === 'multipart_completed') {
          finalPayload = {
            file_id,
            type: isMultipart ? 'multipart' : 'direct',
            ...(isMultipart
              ? {
                  multipart: {
                    upload_id: multipart!.upload_id,
                    tags: [],
                  },
                }
              : { direct: { etag: 'SKIP' } }),
          };
        }

        // Direct Upload
        else if (type === 'direct' && direct) {
          const etag = await putToPresignedUrl({
            upload_url: direct.upload_url,
            blob: file,
            mime_type: file.type,
          });

          finalPayload = { file_id, type: 'direct', direct: { etag } };
          setPercent(100);
        }

        // Multipart Upload
        else {
          const activeInfo = multipart_resume || multipart;
          if (!activeInfo)
            throw new Error('업로드 티켓 데이터가 유효하지 않습니다.');

          const parts = sliceFile(file, activeInfo.part_size);
          const urlMap = new Map(
            activeInfo.upload_urls.map((u) => [u.part_number, u.upload_url]),
          );

          // 이미 완료된 파트 체크 (Resume용)
          const doneTags = new Map(
            multipart_resume?.complete_parts?.map((p) => [
              p.part_number,
              p.etag,
            ]) || [],
          );

          const tags: { part_number: number; etag: string }[] = [];

          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            if (doneTags.has(p.partNumber)) {
              tags.push({
                part_number: p.partNumber,
                etag: doneTags.get(p.partNumber)!,
              });
            } else {
              const upload_url = urlMap.get(p.partNumber);
              if (!upload_url) continue;

              const etag = await putToPresignedUrl({
                upload_url,
                blob: p.blob,
                mime_type: file.type,
              });
              tags.push({ part_number: p.partNumber, etag });
            }

            const currentPercent = Math.floor(((i + 1) / parts.length) * 100);
            setPercent(currentPercent);
          }

          finalPayload = {
            file_id,
            type: 'multipart',
            multipart: { upload_id: activeInfo.upload_id, tags },
          };
        }

        const res = await fileCheck(finalPayload);
        return res;
      } catch (err) {
        console.error('upload error:', err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [fileCheck, requestUploadTicket, socket],
  );

  return {
    uploadFile,
    uploading,
    percent,
  };
};
