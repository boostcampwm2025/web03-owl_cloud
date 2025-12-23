


export type CheckCardItemDataTag = {
  part_number : number;
  etag : string;
};

export type CheckCardItemDatasUrlProps = {
  card_id : string;
  item_id : string;
  tags : Array<CheckCardItemDataTag>;
};