import { cardItemAssetKeyNameVo, cardItemAssetMimeTypeVo, CardItemAssetProps, cardItemAssetSizeVo, cardItemAssetStatusVo } from "@domain/card/vo/card-item-asset.vo";
import { itemIdVo } from "@domain/card/vo";


export class CardItemAsset {

  private readonly item_id : CardItemAssetProps["item_id"];
  private readonly key_name : CardItemAssetProps["key_name"];
  private readonly mime_type : CardItemAssetProps["mime_type"];
  private readonly size : CardItemAssetProps["size"];
  private readonly status : CardItemAssetProps["status"];
  private readonly created_at : Exclude<CardItemAssetProps["created_at"], undefined>;
  private readonly updated_at : Exclude<CardItemAssetProps["updated_at"], undefined>;

  constructor({
    item_id, key_name, mime_type, size, status, created_at = new Date(), updated_at = new Date()
  } : CardItemAssetProps) {
    this.item_id = itemIdVo(item_id);
    this.key_name = cardItemAssetKeyNameVo(key_name);
    this.mime_type = cardItemAssetMimeTypeVo(mime_type);
    this.size = cardItemAssetSizeVo(size);
    this.status = cardItemAssetStatusVo(status);
    this.created_at = created_at && created_at instanceof Date ? created_at : new Date();
    this.updated_at = updated_at && updated_at instanceof Date ? updated_at : new Date();

    Object.freeze(this);
  };

  getItemId() : CardItemAssetProps["item_id"] { return this.item_id; };
  getKeyName() : CardItemAssetProps["key_name"] { return this.key_name; };
  getMimeType() : CardItemAssetProps["mime_type"] { return this.mime_type; };
  getSize() : CardItemAssetProps["size"] { return this.size; };
  getStatus() : CardItemAssetProps["status"] { return this.status; };
  getCreatedAt() : Exclude<CardItemAssetProps["created_at"], undefined> { return this.created_at; };
  getUpadetedAt() : Exclude<CardItemAssetProps["updated_at"], undefined> { return this.updated_at; };

  getData() : Required<CardItemAssetProps> {
    return {
      item_id : this.item_id,
      key_name : this.key_name,
      mime_type : this.mime_type,
      size : this.size,
      status : this.status,
      created_at : this.created_at,
      updated_at : this.updated_at
    };
  };
};