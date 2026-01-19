import { CompleteUploadFileToDisk } from '@app/ports/disk/disk.outbound';
import {
  CompletedPart,
  CompleteMultipartUploadCommand,
  ListPartsCommand,
  ListPartsCommandOutput,
  Part,
  type S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { S3_DISK } from '../../disk.constants';
import { ConfigService } from '@nestjs/config';
import { NotCompleteDataToDisk } from '@error/infra/infra.error';

// 업로드 확인하는 로직
@Injectable()
export class CompleteUploadToAwsS3 extends CompleteUploadFileToDisk<S3Client> {
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

  async complete({
    pathName,
    upload_id,
    size,
  }: {
    pathName: string;
    upload_id: string;
    size: number;
  }): Promise<void> | never {
    const Bucket: string = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', 'bucket');

    // 전체 업로드 버킷 가져오기
    const uploadPartSet = await this.loadAllUploadParts({
      Bucket,
      Key: pathName,
      UploadId: upload_id,
    });

    const expectedTotalParts = Math.ceil(size / (10 * 1024 * 1024)); // 전체 갯수 ( 올림 해주어야 함 )

    for (let pn = 1; pn <= expectedTotalParts; pn++) {
      if (!uploadPartSet.has(pn)) throw new NotCompleteDataToDisk();
    }

    const parts: Array<CompletedPart> = [...uploadPartSet.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([partNumber, etag]) => ({
        PartNumber: partNumber,
        ETag: `"${etag}"`,
      }));

    if (parts.length === 0) throw new NotCompleteDataToDisk();

    await this.disk.send(
      new CompleteMultipartUploadCommand({
        Bucket,
        Key: pathName,
        UploadId: upload_id,
        MultipartUpload: { Parts: parts },
      }),
    );
  }
}
