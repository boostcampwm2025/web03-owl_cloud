export type CheckUploadFileDirectProps = {
  etag: string;
};

export type CheckUploadFileMultipartSubProps = {
  part_number: number;
  etag: string;
};

export type CheckUploadFileMultipartProps = {
  upload_id: string;
  tags: Array<CheckUploadFileMultipartSubProps>;
};

export type CheckUploadFileDto = {
  room_id: string;
  user_id: string;
  file_id: string;
  type: 'direct' | 'multipart';

  direct: CheckUploadFileDirectProps | null;
  multipart: CheckUploadFileMultipartProps | null;
};

export type CheckUploadFileDtoValidate = {
  room_id: string;
  user_id: string;
  file_id: string;
};

export type CheckUploadFileDtoValidateResult = {
  status: 'uploading' | 'completed';
  filename: string;
  size: number;
  category: 'image' | 'video' | 'audio' | 'text' | 'binary';
  upload_id: string | null;
  nickname: string;
  mime_type: string;
};

export type CheckUploadFileResult = {
  filename: string;
  size: number;
  category: 'image' | 'video' | 'audio' | 'text' | 'binary';
  thumbnail_url: string | undefined;
  file_id: string;
  nickname: string;
  user_id: string;
};
