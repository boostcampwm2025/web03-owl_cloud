import { emitAck } from '@/utils/chat';
import { useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';

export const useFileDownload = (socket: Socket | null) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadFile = useCallback(
    async (fileId: string, filename: string) => {
      if (!socket?.connected) return;

      try {
        setDownloadingId(fileId);

        const downloadUrl = await emitAck(
          socket,
          'signaling:ws:file_download',
          {
            file_id: fileId,
          },
        );

        if (!downloadUrl) throw new Error('download url missing');

        // 가상 앵커 태그로 다운로드 진행하기
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (err) {
        console.error('download failed: ', err);
      } finally {
        setDownloadingId(null);
      }
    },
    [socket],
  );

  return {
    downloadFile,
    downloadingId,
    isDownloading: !!downloadingId,
  };
};
