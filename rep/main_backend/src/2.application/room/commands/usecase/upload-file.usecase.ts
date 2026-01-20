import { Injectable } from "@nestjs/common";
import { FindUploadFileInfo, InsertUploadFileInfoDto, MultipartUploadCompleteInfo, UploadFileDto, UploadFileResult } from "../dto";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { GetMultiPartVerCompleteGroupIdFromDisk, GetMultiPartVerGroupIdFromDisk, GetUploadUrlFromDisk } from "@app/ports/disk/disk.inbound";
import { InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { MakeFileIdPort } from "@app/ports/share";
import { NotAllowFileSize, NotFoundResult } from "@error/application/room/room.error";


type UploadFileUsecaseProps<T, ST> = {
  checkUserAndSelectPrevFileInfoFromCache : SelectDataFromCache<T>; // cache에서 과거 file정보를 찾고 user가 맞는지 확인 
  makeFileId : MakeFileIdPort; // file_id를 생성해준다.
  getUploadUrlFromDisk : GetUploadUrlFromDisk<ST>; // upload_url 하나만
  getCompleteUploadUrlFromDisk : GetMultiPartVerCompleteGroupIdFromDisk<ST>; // 이미 받고있었던 upload_id에 완료 목록 가져오기
  getMultiVerGroupIdFromDisk : GetMultiPartVerGroupIdFromDisk<ST>; // 10mb 초과에 처음받는 파일의 경우 upload_id 가져오기 
  insertFileInfoToCache : InsertDataToCache<T>; // file에 대한 정보를 cache에 저장한다. 
};

// 파일을 업로드 하는 usecase 작성
@Injectable()
export class UploadFileUsecase<T, ST> {

  private readonly checkUserAndSelectPrevFileInfoFromCache : UploadFileUsecaseProps<T, ST>["checkUserAndSelectPrevFileInfoFromCache"];
  private readonly makeFileId : UploadFileUsecaseProps<T, ST>["makeFileId"];
  private readonly getUploadUrlFromDisk :  UploadFileUsecaseProps<T, ST>["getUploadUrlFromDisk"];
  private readonly getCompleteUploadUrlFromDisk : UploadFileUsecaseProps<T, ST>["getCompleteUploadUrlFromDisk"];
  private readonly getMultiVerGroupIdFromDisk : UploadFileUsecaseProps<T, ST>["getMultiVerGroupIdFromDisk"];
  private readonly insertFileInfoToCache : UploadFileUsecaseProps<T, ST>["insertFileInfoToCache"];

  constructor({
    checkUserAndSelectPrevFileInfoFromCache, makeFileId, getUploadUrlFromDisk, getCompleteUploadUrlFromDisk, getMultiVerGroupIdFromDisk, insertFileInfoToCache 
  } : UploadFileUsecaseProps<T, ST>) {
    this.checkUserAndSelectPrevFileInfoFromCache = checkUserAndSelectPrevFileInfoFromCache;
    this.makeFileId = makeFileId;
    this.getUploadUrlFromDisk = getUploadUrlFromDisk;
    this.getCompleteUploadUrlFromDisk = getCompleteUploadUrlFromDisk;
    this.getMultiVerGroupIdFromDisk = getMultiVerGroupIdFromDisk;
    this.insertFileInfoToCache = insertFileInfoToCache;
  }

  async execute(dto : UploadFileDto) {

    // 1. 이 유저가 방에 있는고 기존에 다운받던 파일이 있는가 확인 ( upload 중이면서 모든 정보가 같은 경우 그에 대한 파일을 제공해준다. )
    const prevFileInfo : FindUploadFileInfo | undefined = await this.checkUserAndSelectPrevFileInfoFromCache.select({ 
      namespace : `${dto.room_id}:${dto.user_id}`,
      keyName : `${dto.filename}:${dto.mime_type}:${dto.size}`
    }); // 만약 유저가 방에 존재하지 않는다면 error가 발생할 것이다. 
    
    const limitSize : number = 100 * 1024 * 1024;
    if ( dto.size > limitSize ) throw new NotAllowFileSize(limitSize);

    const standardSize : number = 10 * 1024 * 1024;

    // 결과물
    let result : UploadFileResult | undefined = undefined;

    // 이미 다운받고 있었던 파일이 존재한다는 의미이다. ( 그 순간에 두번할 수 있으니까 나중에 정합성 체크도 해줘야 겠다. )
    if ( (dto.size > standardSize) && (prevFileInfo && prevFileInfo.status === "uploading" ) ) {
      const completeParts : MultipartUploadCompleteInfo = await this.getCompleteUploadUrlFromDisk.getCompleteMultiId({ 
        pathName : [ dto.room_id, prevFileInfo.file_id ], mime_type : dto.mime_type });
      
      // result 설정
      result = {
        file_id : prevFileInfo.file_id,
        type : "multipart_complete",
        direct : null,
        multipart : null,
        multipart_complete : completeParts
      }

    }   
    // 이미 같은 파일을 올린적이 있다면 그 파일을 다시 업로드할 필요없이 그대로 주면된다. ( 10mb 이상만 )
    else if ( 
      (prevFileInfo && prevFileInfo.status === "completed" && prevFileInfo.upload_id ) && ( dto.size > standardSize ) ) 
    {
      result = {
        file_id : prevFileInfo.file_id,
        type : "multipart",
        direct : null,
        multipart : {
          upload_id : prevFileInfo.upload_id,
          part_size : standardSize
        },
        multipart_complete : null
      }
      return result;
    }
    else {
      // 2. upload용 url을 받아야 함 ( 총 3가지 10mb 이하 10mb 초과 100mb이하 이미 받던 파일 ) 
      const file_id : string = this.makeFileId.make();
      const pathName : Array<string> = [ dto.room_id, file_id ];

      // 기본 설정
      result = {
        file_id,
        multipart_complete : null,
        type : "direct",
        direct : null,
        multipart: null
      };

      // 10mb 이하 
      if ( dto.size <= standardSize ) {
        const upload_url : string = await this.getUploadUrlFromDisk.getUrl({ pathName, mime_type : dto.mime_type });

        // result
        result.type = "direct";
        result.direct = { upload_url };
        result.multipart = null;       
      } 
      // 10mb 초과 
      else {  
        const upload_id : string = await this.getMultiVerGroupIdFromDisk.getMultiId({ pathName, mime_type : dto.mime_type });

        // result
        result.type = "multipart";
        result.direct = null;
        result.multipart = { upload_id, part_size : standardSize }; 
      };
    };
    
    // 3. 저장을 하기로 하였다. 
    if ( !result ) throw new NotFoundResult();
    const insertDto : InsertUploadFileInfoDto = {
      ...dto, upload_id : result.multipart?.upload_id, file_id : result.file_id
    };
    await this.insertFileInfoToCache.insert(insertDto);

    // 4. 반환 
    return result;
  };

};