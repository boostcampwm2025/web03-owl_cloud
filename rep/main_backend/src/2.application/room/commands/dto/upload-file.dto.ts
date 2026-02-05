export type FileCategory = 'image' | 'video' | 'audio' | 'text' | 'binary';

// 파일을 업로드 하기 위해서 필요한 dto
export type UploadFileDto = {
  room_id: string;
  user_id: string;
  nickname: string;
  filename: string;
  mime_type: string;
  category: FileCategory;
  size: number;
};

// cache에서 가져온 데이터
export type FindUploadFileInfo = {
  file_id: string;
  upload_id: string | null;
  status: 'uploading' | 'completed';
};

export type DirectUploadInfo = {
  upload_url: string;
};

export type UploadUrls = {
  upload_url: string;
  part_number: number;
};

export type MultipartUploadInitInfo = {
  upload_id: string;
  part_size: number;
  upload_urls: Array<UploadUrls>; // 이제 업로드를 실행해야 할 url들
};

export type MultipartCompletedPart = {
  part_number: number;
  etag: string;
};

export type MultipartUploadResumeInfoValue = {
  upload_id: string;
  complete_parts: Array<MultipartCompletedPart>;
  part_size: number;
};

export type MultipartUploadResumeInfo = {
  upload_id: string;
  part_size: number;
  complete_parts: Array<MultipartCompletedPart>;
  upload_urls: Array<UploadUrls>; // 이제 업로드를 실행해야할 url들
};

// 데이터를 insert할때 사용되는 dto
export interface InsertUploadFileInfoDto extends UploadFileDto {
  file_id: string;
  upload_id?: string;
}

export type UploadFileResult = {
  type: 'direct' | 'multipart' | 'multipart_resume' | 'multipart_completed'; // multipart_complete가 upload 남은거

  file_id: string;

  direct: DirectUploadInfo | null;

  multipart: MultipartUploadInitInfo | null;

  multipart_resume: MultipartUploadResumeInfo | null;
};
