import { Injectable } from '@nestjs/common';
import {
  CheckUploadFileDto,
  CheckUploadFileDtoValidateResult,
  CheckUploadFileResult,
} from '../dto';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import {
  NotAllowRoomFileData,
  NotAllowRoomMemberFile,
  NotAllowUpdateFileData,
} from '@error/application/room/room.error';
import {
  CheckUploadDataFromDisk,
  CheckUploadDatasFromDisk,
  GetDownloadUrlFromDisk,
} from '@app/ports/disk/disk.inbound';
import { CompleteUploadFileToDisk } from '@app/ports/disk/disk.outbound';
import { InsertDataToCache } from '@app/ports/cache/cache.outbound';

type CheckUploadFileUsecaseProps<T, ST> = {
  checkUserAndSelectFileInfoFromCache: SelectDataFromCache<T>; // 현재 유저가 방에 있는지 확인하고 file_id가 맞는지 확인
  checkUploadFromDisk: CheckUploadDataFromDisk<ST>; // upload가 제대로 되는지 확인하는 disk
  checkUploadsFromDisk: CheckUploadDatasFromDisk<ST>; // upload가 제대로 되는지 disk로 확인
  completeUploadToDisk: CompleteUploadFileToDisk<ST>; // file을 최종적으로 upload 확인
  updateFileInfoToCache: InsertDataToCache<T>; // 데이터를 업데이트 하는 로직
  getUploadUrlFromDisk: GetDownloadUrlFromDisk<ST>; // upload_url을 가져오는 로직 ( thumbnail_url이 필요한 경우 )
};

@Injectable()
export class CheckUploadFileUsecase<T, ST> {
  private readonly checkUserAndSelectFileInfoFromCache: CheckUploadFileUsecaseProps<
    T,
    ST
  >['checkUserAndSelectFileInfoFromCache'];
  private readonly checkUploadFromDisk: CheckUploadFileUsecaseProps<T, ST>['checkUploadFromDisk'];
  private readonly checkUploadsFromDisk: CheckUploadFileUsecaseProps<T, ST>['checkUploadsFromDisk'];
  private readonly completeUploadToDisk: CheckUploadFileUsecaseProps<T, ST>['completeUploadToDisk'];
  private readonly updateFileInfoToCache: CheckUploadFileUsecaseProps<
    T,
    ST
  >['updateFileInfoToCache'];
  private readonly getUploadUrlFromDisk: CheckUploadFileUsecaseProps<T, ST>['getUploadUrlFromDisk'];

  constructor({
    checkUserAndSelectFileInfoFromCache,
    checkUploadFromDisk,
    checkUploadsFromDisk,
    completeUploadToDisk,
    updateFileInfoToCache,
    getUploadUrlFromDisk,
  }: CheckUploadFileUsecaseProps<T, ST>) {
    this.checkUserAndSelectFileInfoFromCache = checkUserAndSelectFileInfoFromCache;
    this.checkUploadFromDisk = checkUploadFromDisk;
    this.checkUploadsFromDisk = checkUploadsFromDisk;
    this.completeUploadToDisk = completeUploadToDisk;
    this.updateFileInfoToCache = updateFileInfoToCache;
    this.getUploadUrlFromDisk = getUploadUrlFromDisk;
  }

  async execute(dto: CheckUploadFileDto): Promise<CheckUploadFileResult> {
    // 1. 해당 방에 유저가 있고 이 file_id가 올바른지 체크 ( 만약 status가 complete라면 바로 넘어가기 )
    const checkResult: CheckUploadFileDtoValidateResult | undefined =
      await this.checkUserAndSelectFileInfoFromCache.select({
        namespace: `${dto.room_id}:${dto.user_id}`,
        keyName: dto.file_id,
      });
    if (!checkResult) throw new NotAllowRoomMemberFile();

    const pathName: string = `${dto.room_id}/${dto.file_id}`;
    const standardSize: number = 10 * 1024 * 1024;
    let thumbnail_url: string | undefined = undefined;
    // 데이터 체크
    if (dto.type === 'direct') {
      // 하나일 경우
      if (!dto.direct) throw new NotAllowRoomFileData('direct');
      if (checkResult.upload_id) throw new NotAllowRoomFileData('direct type'); // 만약 upload_id인데 direct로 잘못 보냈다면

      const checked: boolean = await this.checkUploadFromDisk.check({
        pathName,
        etag: dto.direct.etag,
      });
      if (!checked) throw new NotAllowRoomFileData('direct upload_url');
    } else {
      if (!dto.multipart) throw new NotAllowRoomFileData('multipart');
      if (checkResult.size <= standardSize) throw new NotAllowRoomFileData('size');
      if (dto.multipart.upload_id !== checkResult.upload_id)
        throw new NotAllowRoomFileData('upload_id');

      if (checkResult.status === 'uploading') {
        const checked: boolean = await this.checkUploadsFromDisk.checks({
          pathName,
          upload_id: dto.multipart.upload_id,
          tags: dto.multipart.tags,
        });

        if (!checked) throw new NotAllowRoomFileData('multipary tags');

        // 문제없을 경우 결합
        await this.completeUploadToDisk.complete({
          pathName,
          upload_id: dto.multipart.upload_id,
          size: checkResult.size,
        });
      }
    }

    // image나 video인경우 thumbnail을 가져온다.
    if (checkResult.category === 'image' || checkResult.category === 'video')
      thumbnail_url = await this.getUploadUrlFromDisk.getUrl({
        pathName: [dto.room_id, dto.file_id],
        filename: undefined,
      });

    if (checkResult.status !== 'completed') {
      // 2. 데이터 저장
      const inserted: boolean = await this.updateFileInfoToCache.insert(dto); // room_id:user_id에서 file_id에 해당하는 상태만 변경해주면 된다.
      if (!inserted) throw new NotAllowUpdateFileData();
    }

    // 3. 반환한다.
    return {
      filename: checkResult.filename,
      size: checkResult.size,
      category: checkResult.category,
      thumbnail_url,
      file_id: dto.file_id,
      nickname: checkResult.nickname,
      user_id: dto.user_id,
    };
  }
}
