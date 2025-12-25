import { Injectable } from "@nestjs/common";
import { GetUrlTypes, MultiPartResponseDataDto, UploadMultipartDataDto } from "@app/card/queries/dto";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { NotFoundCardItemAssetKeyName } from "@error/application/card/card.error";
import { GetMultiPartUploadUrlFromDisk } from "@app/ports/disk/disk.inbound";
import { CardItemAssetProps } from "@domain/card/vo";
import { InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { InsertCardAssetDataProps } from "../../commands/usecase";
import { PathMapping } from "@domain/shared";


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
  pathMapping : PathMapping // path를 만드는 인터페이스
  getUploadUrlsFromDisk : GetMultiPartUploadUrlFromDisk<DT>; // url들 가져오는거
  insertCardAssetToCache : InsertDataToCache<T>; // 데이터 추가 하는 로직
};

// upload_id를 발급 받았을때 그를 바탕으로 데이터를 가져오고 싶을때 사용
@Injectable()
export class GetMultipartDataUrlUsecase<T, ET, DT> {

  private readonly usecaseValues : GetMultipartDataUrlUsecaseProps<T, ET, DT>["usecaseValues"];
  private readonly selectCardAssetFromCache : GetMultipartDataUrlUsecaseProps<T, ET, DT>["selectCardAssetFromCache"];
  private readonly selectCardAssetFromDb : GetMultipartDataUrlUsecaseProps<T, ET, DT>["selectCardAssetFromDb"];
  private readonly pathMapping : GetMultipartDataUrlUsecaseProps<T, ET, DT>["pathMapping"];
  private readonly getUploadUrlsFromDisk : GetMultipartDataUrlUsecaseProps<T, ET, DT>["getUploadUrlsFromDisk"];
  private readonly insertCardAssetToCache : GetMultipartDataUrlUsecaseProps<T, ET, DT>["insertCardAssetToCache"];

  constructor ({
    usecaseValues, selectCardAssetFromCache, selectCardAssetFromDb, pathMapping, getUploadUrlsFromDisk, insertCardAssetToCache
  } : GetMultipartDataUrlUsecaseProps<T, ET, DT>) {
    this.usecaseValues = usecaseValues;
    this.selectCardAssetFromCache = selectCardAssetFromCache;
    this.selectCardAssetFromDb = selectCardAssetFromDb;
    this.pathMapping = pathMapping;
    this.getUploadUrlsFromDisk = getUploadUrlsFromDisk;
    this.insertCardAssetToCache = insertCardAssetToCache;
  }

  async execute( dto : UploadMultipartDataDto ) : Promise<MultiPartResponseDataDto> {

    // 1. 데이터 찾기 ( cache 확인 -> db 확인 )
    let filePath : string | undefined;
    let cardAsset : Required<CardItemAssetProps> | undefined;

    const namespace : string = `${this.usecaseValues.cardAssetNamespace}:${dto.card_id}:${dto.item_id}`.trim();
    cardAsset = await this.selectCardAssetFromCache.select({ 
      namespace,
      keyName : this.usecaseValues.itemIdKeyName
    });

    // cache에 없다면 db에서 찾기 + cache 저장
    if ( !cardAsset ) {
      cardAsset = await this.selectCardAssetFromDb.select({ attributeName : this.usecaseValues.itemIdAttribute, attributeValue : dto.item_id });
      if ( !cardAsset ) throw new NotFoundCardItemAssetKeyName();
      
      // asset 캐시 정보 저장
      const insertAsset : InsertCardAssetDataProps = {
        cardAsset, upload_id : dto.upload_id
      }
      await this.insertCardAssetToCache.insert(insertAsset);
    }

    // file의 주소 생성
    filePath = this.pathMapping.mapping(
      [
        cardAsset.card_id,
        cardAsset.item_id,
        cardAsset.key_name
      ]
    );
    if (!filePath) throw new NotFoundCardItemAssetKeyName();    

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