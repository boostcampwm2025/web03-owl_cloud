import {
  CheckUploadDataFromDisk,
  CheckUploadDatasFromDisk,
  GetMultiPartUploadUrlFromDisk,
  GetMultiPartVerCompleteGroupIdFromDisk,
  GetMultiPartVerGroupIdFromDisk,
  GetUploadUrlFromDisk,
  GetUploadUrlsFromDisk,
} from '@app/ports/disk/disk.inbound';
import {
  CreateMultipartUploadCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListMultipartUploadsCommand,
  ListPartsCommand,
  ListPartsCommandOutput,
  Part,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { S3_DISK } from '../../disk.constants';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import { DiskError, NotMakeUploadId } from '@error/infra/infra.error';

// 일단 타입들은 놔두기 ( branch - feature/#17/quest-card 참고 해야 함 )
export type GetUrlTypes = {
  upload_url: string;
  part_number: number;
};

export type CheckCardItemDataTag = {
  part_number: number;
  etag: string;
};

export type CompletePartsType = {
  part_number: number;
  etag: string;
};

export type ChangeFileType = {
  upload_id: string;
  complete_parts: Array<CompletePartsType>;
  part_size: number;
};

@Injectable()
export class GetPresignedUrlFromS3Bucket extends GetUploadUrlFromDisk<S3Client> {
  // 받아오기
  constructor(
    @Inject(S3_DISK) disk: S3Client,
    private readonly config: ConfigService,
  ) {
    super(disk);
  }

  // path의 옵션은 card_id/item_id/filename
  async getUrl({
    pathName,
    mime_type,
  }: {
    pathName: Array<string>;
    mime_type: string;
  }): Promise<string> {
    // 설정
    const key_name: string = path.posix.join(...pathName); // os와 상관없이 규칙을 /로 통일
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'bucket_name');
    const expiresIn: number = this.config.get<number>(
      'NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC',
      180,
    );

    const command = new PutObjectCommand({
      Bucket,
      Key: key_name,
      ContentType: mime_type,
    });

    // url 요청
    const uploadUrl = await getSignedUrl(this.disk, command, {
      expiresIn,
    });

    return uploadUrl;
  }
}

// upload_id 를 가져오고 그에 따라서
@Injectable()
export class GetMultipartUploadIdFromS3Bucket extends GetMultiPartVerGroupIdFromDisk<S3Client> {
  constructor(
    @Inject(S3_DISK) disk: S3Client,
    private readonly config: ConfigService,
  ) {
    super(disk);
  }

  async getMultiId({
    pathName,
    mime_type,
  }: {
    pathName: Array<string>;
    mime_type: string;
  }): Promise<string> {
    const key_name: string = path.posix.join(...pathName); // os와 상관없이 규칙을 /로 통일
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'bucket_name');

    const command = new CreateMultipartUploadCommand({
      Bucket,
      Key: key_name,
      ContentType: mime_type,
    });

    const res = await this.disk.send(command);

    return res.UploadId!;
  }
}

// upload_id에 따라서 presigned_url을 제공
@Injectable()
export class GetPresignedUrlsFromS3Bucket extends GetMultiPartUploadUrlFromDisk<S3Client> {
  constructor(
    @Inject(S3_DISK) disk: S3Client,
    private readonly config: ConfigService,
  ) {
    super(disk);
  }

  async getUrls({
    upload_id,
    pathName,
    partNumbers,
  }: {
    upload_id: string;
    pathName: string;
    partNumbers: Array<number>;
  }): Promise<Array<GetUrlTypes>> {
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'bucket_name');
    const expiresIn: number = this.config.get<number>(
      'NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC',
      180,
    );

    return Promise.all(
      partNumbers.map(async (partNumber: number) => {
        const command = new UploadPartCommand({
          Bucket,
          Key: pathName,
          UploadId: upload_id,
          PartNumber: partNumber,
        });

        const upload_url: string = await getSignedUrl(this.disk, command, { expiresIn });

        return { upload_url, part_number: partNumber };
      }),
    );
  }
}

@Injectable()
export class CheckPresignedUrlFromAwsS3 extends CheckUploadDataFromDisk<S3Client> {
  constructor(
    @Inject(S3_DISK) disk: S3Client,
    private readonly config: ConfigService,
  ) {
    super(disk);
  }

  async check({ pathName, etag }: { pathName: string; etag: string }): Promise<boolean> {
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'bucket');

    try {
      const result = await this.disk.send(
        new HeadObjectCommand({
          Bucket,
          Key: pathName,
        }),
      );
      if (!result.ETag) return false;

      // 보통 s3에는 "" 이런식으로 가져온다고 한다.
      const s3Etag = result.ETag.replace(/"/g, '');
      const inputEtag = etag.replace(/"/g, '');

      // 같으면 맞고 아니면 에러
      return s3Etag === inputEtag;
    } catch (err) {
      throw new DiskError(err);
    }
  }
}

@Injectable()
export class CheckUploadDatasFromAwsS3 extends CheckUploadDatasFromDisk<S3Client> {
  constructor(
    @Inject(S3_DISK) disk: S3Client,
    private readonly config: ConfigService,
  ) {
    super(disk);
  }

  private parseEtag(etag: string): string {
    return etag.replace(/"/g, '').trim();
  }

  // 현재 업로드 된 전체 리스트 가져오기
  private async loadAllUploadParts({
    Bucket,
    Key,
    UploadId,
  }: {
    Bucket: string;
    Key: string;
    UploadId: string;
  }): Promise<Map<number, string>> {
    const disk = this.disk;

    const uploadPartSet = new Map<number, string>();
    let nextPartNumber: string | undefined = undefined;

    while (true) {
      const res: ListPartsCommandOutput = await disk.send(
        new ListPartsCommand({
          Bucket,
          Key,
          UploadId,
          PartNumberMarker: nextPartNumber,
        }),
      );

      const parts: Array<Part> = res.Parts ?? []; // null, undefiend이면 빈 배열
      for (const part of parts) {
        if (typeof part.PartNumber === 'number' && typeof part.ETag === 'string') {
          uploadPartSet.set(part.PartNumber, this.parseEtag(part.ETag));
        }
      }

      if (!res.IsTruncated) break;

      nextPartNumber = String(res.NextPartNumberMarker);
      if (!nextPartNumber) break;
    }

    return uploadPartSet;
  }

  // 여러개의 etag일 경우 이를 이용해서 검증을 해주어야 한다.
  async checks({
    pathName,
    upload_id,
    tags,
  }: {
    pathName: string;
    upload_id: string;
    tags: Array<CheckCardItemDataTag>;
  }): Promise<boolean> {
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'bucket');

    if (!tags || tags.length === 0) return false;

    const uploadPartSet = await this.loadAllUploadParts({
      Bucket,
      Key: pathName,
      UploadId: upload_id,
    });

    // tag 추가 검증
    for (const tag of tags) {
      const pn: number = tag.part_number;
      const etag: string = tag.etag;

      if (typeof pn !== 'number' || typeof etag !== 'string') return false;

      const s3Etag = uploadPartSet.get(pn);

      if (!s3Etag) return false;

      if (s3Etag !== this.parseEtag(etag)) return false;
    }

    // 지금 까지 검증된 데이터 complete로 합치기

    return true;
  }
}

// 완료한 multipary tag를 다시 가져오는거 -> 업데이트 할때 사용될 예정
@Injectable()
export class GetCompleteMultipartTagsFromAwsS3 extends GetMultiPartVerCompleteGroupIdFromDisk<S3Client> {
  constructor(
    @Inject(S3_DISK) disk: S3Client,
    private readonly config: ConfigService,
  ) {
    super(disk);
  }

  private parseEtag(etag: string): string {
    return etag.replace(/"/g, '').trim();
  }

  // upload_id를 찾는다.
  private async findUploadId({
    Bucket,
    key_name,
  }: {
    Bucket: string;
    key_name: string;
  }): Promise<string | undefined> {
    const disk = this.disk;

    const res = await disk.send(
      new ListMultipartUploadsCommand({
        Bucket,
        Prefix: key_name,
      }),
    );

    const uploads = res.Uploads ?? [];
    if (uploads.length === 0) return undefined;

    // 가장 최신의 key를 가져온다.
    const matched = uploads
      .filter((u) => u.Key === key_name && u.UploadId)
      .sort((a, b) => {
        const ta = a.Initiated ? new Date(a.Initiated).getTime() : 0;
        const tb = b.Initiated ? new Date(b.Initiated).getTime() : 0;
        return tb - ta;
      });

    return matched[0]?.UploadId;
  }

  // 새로운 upload_id를 만든다.
  private async createUploadId({
    Bucket,
    key_name,
    mime_type,
  }: {
    Bucket: string;
    key_name: string;
    mime_type: string;
  }): Promise<string> {
    const res = await this.disk.send(
      new CreateMultipartUploadCommand({
        Bucket,
        Key: key_name,
        ContentType: mime_type,
        // 필요하면 Metadata/CacheControl 등 추가
      }),
    );

    if (!res.UploadId) throw new NotMakeUploadId();

    return res.UploadId;
  }

  // 완료 목록 가져오기
  private async loadCompleteParts({
    Bucket,
    key_name,
    UploadId,
  }: {
    Bucket: string;
    key_name: string;
    UploadId: string;
  }): Promise<Array<CompletePartsType>> {
    const disk = this.disk;

    let parts: Array<CompletePartsType> = [];
    let nextPartNumberMarker: string | undefined = undefined;

    while (true) {
      const res: ListPartsCommandOutput = await disk.send(
        new ListPartsCommand({
          Bucket,
          Key: key_name,
          UploadId,
          PartNumberMarker: nextPartNumberMarker,
        }),
      );

      for (const p of res.Parts ?? []) {
        if (p.PartNumber && p.ETag) {
          parts.push({
            part_number: p.PartNumber,
            etag: this.parseEtag(p.ETag),
          });
        }
      }

      if (!res.IsTruncated) break;
      nextPartNumberMarker = res.NextPartNumberMarker?.toString();
      if (!nextPartNumberMarker) break;
    }

    parts.sort((a, b) => (a.part_number ?? 0) - (b.part_number ?? 0));
    return parts;
  }

  async getCompleteMultiId({
    pathName,
    mime_type,
  }: {
    pathName: Array<string>;
    mime_type: string;
  }): Promise<ChangeFileType> {
    const key_name: string = path.posix.join(...pathName);
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'Bucket');

    // upload_id를 먼저 찾는다.
    let UploadId: string | undefined = await this.findUploadId({ Bucket, key_name });

    // 만약 없다면 새로운 upload_id를 발급하고 빈 완료목록을 준다.
    if (!UploadId) {
      UploadId = await this.createUploadId({ Bucket, key_name, mime_type });
      // 기존의 코드를 최대한 이용하기로 한다.
      return {
        upload_id: UploadId,
        complete_parts: [],
        part_size: 10 * 1024 * 1024,
      };
    }

    // 완료 목록을 가져온다.
    const complete_parts: Array<CompletePartsType> = await this.loadCompleteParts({
      Bucket,
      key_name,
      UploadId,
    });

    return {
      upload_id: UploadId,
      complete_parts,
      part_size: 10 * 1024 * 1024,
    };
  }
}

// card_item의 파일에 대해서 -> 전체 파일을 열때 presieng_url을 발급
@Injectable()
export class GetPresingendUrlsFromAwsS3 extends GetUploadUrlsFromDisk<S3Client> {
  constructor(
    @Inject(S3_DISK) disk: S3Client,
    private readonly config: ConfigService,
  ) {
    super(disk);
  }

  // item_id : presiegen_url 이런식으로 줄 예정이다.
  async getUrls(
    paths: Array<{ uniqueKey: string; pathName: string; mime_type: string }>,
  ): Promise<Record<string, string>> {
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'bucket');
    const expiresIn: number = this.config.get<number>(
      'NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC',
      180,
    ); // 기본은 3분

    const results: Record<string, string> = {};
    await Promise.all(
      paths.map(async (path: { uniqueKey: string; pathName: string; mime_type: string }) => {
        const command = new GetObjectCommand({
          Bucket,
          Key: path.pathName,
        });
        const presigend_url = await getSignedUrl(this.disk, command, {
          expiresIn,
        });
        if (presigend_url) results[path.uniqueKey] = presigend_url;
      }),
    );

    return results;
  }
}
