


export type UpdateCardItemInfoProps = {
  item_id : string;
  card_id : string;
  type : 'image' | 'video';
  path : string;
  mime_type : 'image/apng' | 'image/avif' | 'image/gif' | 'image/jpeg' | 'image/png' | 'image/svg+xml' | 'image/webp' | 'video/mp4' | 'video/webm' | 'video/ogg';
  size : number;
};

export type UpdateCardItemAssetValueProps = {
  item_id : string;
  key_name : string | undefined;
  mime_type : 'image/apng' | 'image/avif' | 'image/gif' | 'image/jpeg' | 'image/png' | 'image/svg+xml' | 'image/webp' | 'video/mp4' | 'video/webm' | 'video/ogg' | undefined;
  size : number | undefined;
  status : 'uploading' | 'ready' | 'failed' | undefined;
  upload_id : string | undefined;
};

type MiniSizeFileType = {
  upload_url : string;
};

type BigSizeFileType = {
  upload_id : string; 
  part_size : number;
};

export type CompletePartsType = {
  part_number : number;
  etag : string;
};

export type ChangeFileType = {
  upload_id : string;
  complete_parts : Array<CompletePartsType>
};  

export type AfterUpdateCardItemDataInfo = {
  item_id : string;

  mini? : MiniSizeFileType;

  big? : BigSizeFileType;
  
  change? : ChangeFileType;
};