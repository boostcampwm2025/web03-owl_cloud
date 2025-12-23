


export type CardItemFileInfoDto = {
  path : string;
  mime_type : 'image/apng' | 'image/avif' | 'image/gif' | 'image/jpeg' | 'image/png' | 'image/svg+xml' | 'image/webp' | 'video/mp4' | 'video/webm' | 'video/ogg';
  size : number;
};

export type CreateCardItemDataDto = {
  card_id : string;
  type : 'text' | 'image' | 'video';
  x : number;
  y : number;
  width : number;
  height? : number | undefined;
  rotation? : number; // default 0
  scale_x? : number; // default 1.000
  scale_y? : number; // default 1.000
  opacity? : number | undefined;
  z_index? : number | undefined;
  is_locked? : boolean | undefined;
  is_visible? : boolean | undefined;
  name? : string | undefined;
  option : Record<string, any>;

  // 파일 저장이 있다면 추가
  file_info? : CardItemFileInfoDto
};

export type MiniSizeFileType = {
  presigned_url : string;
};

export type BigSizeFileType = {
  upload_id : string; 
  part_size : number;
};

export type AfterCreateCardItemDataInfo = {
  item_id : string;

  mini? : MiniSizeFileType;

  big? : BigSizeFileType;
};