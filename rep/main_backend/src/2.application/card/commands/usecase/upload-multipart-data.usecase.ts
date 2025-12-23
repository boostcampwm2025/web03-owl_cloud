import { Injectable } from "@nestjs/common";
import { GetUrlTypes, MultiPartResponseDataDto, UploadMultipartDataDto } from "../dto";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { NotFoundCardItemAssetKeyName } from "@error/application/card/card.error";
import { GetMultiPartUploadUrlFromDisk } from "@app/ports/disk/disk.inbound";


type GetMultipartDataUrlUsecaseValues = {
  cardAssetNamespace : string;
  itemIdKeyName : string;
  itemIdAttribute : string;
};

// 이 usecase에서 사용할 객체들
type GetMultipartDataUrlUsecaseProps<T, ET, DT> = {
  usecaseValues : GetMultipartDataUrlUsecaseValues;
  selectCardAssetFromCache : SelectDataFromCache<T>; // cache 부터 찾고
  selectCardAssetFromDb : SelectDataFromDb<ET>;  // 없으면 db
  getUploadUrlsFromDisk : GetMultiPartUploadUrlFromDisk<DT>;
};

// upload_id를 발급 받았을때 그를 바탕으로 데이터를 가져오고 싶을때 사용
@Injectable()
export class GetMultipartDataUrlUsecase<T, ET, DT> {

  private readonly usecaseValues : GetMultipartDataUrlUsecaseProps<T, ET, DT>["usecaseValues"];
  private readonly selectCardAssetFromCache : GetMultipartDataUrlUsecaseProps<T, ET, DT>["selectCardAssetFromCache"];
  private readonly selectCardAssetFromDb : GetMultipartDataUrlUsecaseProps<T, ET, DT>["selectCardAssetFromDb"];
  private readonly getUploadUrlsFromDisk : GetMultipartDataUrlUsecaseProps<T, ET, DT>["getUploadUrlsFromDisk"];

  constructor ({
    usecaseValues, selectCardAssetFromCache, selectCardAssetFromDb, getUploadUrlsFromDisk
  } : GetMultipartDataUrlUsecaseProps<T, ET, DT>) {
    this.usecaseValues = usecaseValues;
    this.selectCardAssetFromCache = selectCardAssetFromCache;
    this.selectCardAssetFromDb = selectCardAssetFromDb;
    this.getUploadUrlsFromDisk = getUploadUrlsFromDisk;
  }

  async execute( dto : UploadMultipartDataDto ) : Promise<MultiPartResponseDataDto> {

    // 1. 데이터 찾기 ( cache 확인 -> db 확인 )
    let filePath : string | undefined;
    const namespace : string = `${this.usecaseValues.cardAssetNamespace}:${dto.card_id}:${dto.item_id}`.trim();
    filePath = await this.selectCardAssetFromCache.select({ 
      namespace,
      keyName : this.usecaseValues.itemIdKeyName
    });
    if ( !filePath ) {
      filePath = await this.selectCardAssetFromDb.select({ attributeName : this.usecaseValues.itemIdAttribute, attributeValue : dto.item_id });
      if (!filePath) throw new NotFoundCardItemAssetKeyName();
    }

    // 2. url들 가져오기 
    const upload_urls : Array<GetUrlTypes> = await this.getUploadUrlsFromDisk.getUrls({ upload_id : dto.upload_id, pathName : filePath, partNumbers : dto.part_numbers });
    
    // 3. 보내기
    const returnValues : MultiPartResponseDataDto = {
      item_id : dto.item_id,
      upload_urls
    };
    return returnValues;
  }
};