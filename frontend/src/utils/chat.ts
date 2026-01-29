import { RecvMessagePayload } from '@/hooks/chat/useChatSocket';
import { ChatMessage } from '@/types/chat';
import { Socket } from 'socket.io-client';

// 카테고리 헬퍼함수
export const pickCategory = (file: File) => {
  const mime = file.type || '';

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('text/') || mime === 'application/json') return 'text';
  return 'binary';
};

export const sliceFile = (file: File, partSize: number) => {
  const parts: { partNumber: number; blob: Blob }[] = [];

  let offset = 0;
  let partNumber = 1;

  while (offset < file.size) {
    const end = Math.min(offset + partSize, file.size);
    parts.push({
      partNumber,
      blob: file.slice(offset, end),
    });
    offset = end;
    partNumber++;
  }

  return parts;
};

export async function putToPresignedUrl({
  upload_url,
  blob,
  mime_type,
}: {
  upload_url: string;
  blob: Blob;
  mime_type?: string;
}) {
  const res = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': mime_type || 'application/octet-stream',
    },
    body: blob,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`S3 PUT failed: ${res.status} ${text}`);
  }

  const etagRaw = res.headers.get('etag');
  if (!etagRaw) throw new Error('ETag missing');

  return etagRaw.replaceAll('"', '');
}

export function emitAck<T = any>(
  socket: Socket,
  event: string,
  payload?: any,
  timeout = 10000, // 10초 타임아웃
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;

    // 타임아웃 처리
    if (timeout > 0) {
      timer = setTimeout(() => {
        reject(new Error(`emitAck timeout: ${event}`));
      }, timeout);
    }

    socket.emit(event, payload, (res: any) => {
      if (timer) clearTimeout(timer);

      // 서버가 에러 형태로 내려주는 경우 대응
      if (res?.error) {
        reject(new Error(res.error));
        return;
      }

      resolve(res);
    });
  });
}

export function mapRecvPayloadToChatMessage(
  payload: RecvMessagePayload,
): ChatMessage {
  const base = {
    id: crypto.randomUUID(),
    userId: payload.user_id,
    nickname: payload.nickname,
    profileImg: payload.profileImg,
    createdAt: new Date().toISOString(),
  };

  if (payload.type === 'message') {
    return {
      ...base,
      content: {
        type: 'text',
        text: payload.message,
      },
    };
  }

  return {
    ...base,
    content: {
      type: payload.type,
      fileId: payload.file_id,
      filename: payload.filename,
      size: payload.size,
      category: payload.category,
      fileUrl: payload.thumbnail_url,
    },
  };
}
