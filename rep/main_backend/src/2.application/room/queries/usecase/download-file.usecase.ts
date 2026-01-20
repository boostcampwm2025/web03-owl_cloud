import { GetDownloadUrlFromDisk, GetUploadUrlFromDisk } from "@app/ports/disk/disk.inbound";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { Injectable } from "@nestjs/common";
import { DownLoadFileDto } from "../dto";
import { NotAllowRoomMemberFile } from "@error/application/room/room.error";


type DownLaodFileUsecaseProps<T, ST> = {
  checkRoomMemberFromCache : SelectDataFromCache<T>; // 현재 방에 있는 유저인지 확인하는 로직
  getUploadUrlFromDisk : GetDownloadUrlFromDisk<ST> // disk에서 upload_url을 가져오는 로직 
};

@Injectable()
export class DownLoadFileUsecase<T, ST> {

  private readonly checkRoomMemberFromCache : DownLaodFileUsecaseProps<T, ST>["checkRoomMemberFromCache"];
  private readonly getUploadUrlFromDisk : DownLaodFileUsecaseProps<T, ST>["getUploadUrlFromDisk"];

  constructor({
    checkRoomMemberFromCache, getUploadUrlFromDisk
  } : DownLaodFileUsecaseProps<T, ST>) {
    this.checkRoomMemberFromCache = checkRoomMemberFromCache;
    this.getUploadUrlFromDisk = getUploadUrlFromDisk;
  }

  async execute(dto : DownLoadFileDto) : Promise<string> {

    // 1. 방에 있는 유저가 맞는지 그리고 file_id에 상태가 completed가 맞는지 확인
    const fileName : string | undefined = await this.checkRoomMemberFromCache.select({ namespace : `${dto.room_id}:${dto.user_id}`, keyName : dto.file_id });
    if ( !fileName ) throw new NotAllowRoomMemberFile();

    // 2. 다운로드 url 발급
    const upload_url : string = await this.getUploadUrlFromDisk.getUrl({ pathName : [ dto.room_id, dto.file_id ], filename: fileName });

    return upload_url; 
  };
};