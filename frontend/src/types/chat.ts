export type TextContent = {
  type: 'text';
  text: string;
};

export type FileCategory = 'image' | 'video' | 'audio' | 'text' | 'binary';

export type FileContent = {
  type: 'file';
  fileId: string;
  size: number;
  filename: string;
  category: FileCategory;
  fileUrl?: string;
};

export type ChatContent = TextContent | FileContent;

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  profileImg?: string;
  createdAt: string;
  content: ChatContent;
}

export type UploadTicket = {
  type: 'direct' | 'multipart' | 'multipart_resume' | 'multipart_completed';
  file_id: string;

  // direct 업로드 정보
  direct: {
    upload_url: string;
  } | null;

  // multipart 업로드 정보
  multipart: {
    upload_id: string;
    part_size: number;
    upload_urls: { part_number: number; upload_url: string }[];
  } | null;

  // multipart Resume 정보
  multipart_resume: {
    upload_id: string;
    part_size: number;
    upload_urls: { part_number: number; upload_url: string }[];
    complete_parts: { part_number: number; etag: string }[];
  } | null;
};

export type FileCheckPayload = {
  file_id: string;
  type: 'direct' | 'multipart';
  direct?: { etag: string };
  multipart?: {
    upload_id: string;
    tags: { part_number: number; etag: string }[];
  };
};
