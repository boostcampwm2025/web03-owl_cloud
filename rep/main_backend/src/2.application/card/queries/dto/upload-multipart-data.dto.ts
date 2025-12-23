


export type UploadMultipartDataDto = {
  card_id : string;
  item_id : string;
  upload_id : string;
  part_numbers : Array<number>;
};

export type GetUrlTypes = {
  upload_url : string;
  part_number : number;
};

export type MultiPartResponseDataDto = {
  item_id : string;
  upload_urls : Array<GetUrlTypes>;
};