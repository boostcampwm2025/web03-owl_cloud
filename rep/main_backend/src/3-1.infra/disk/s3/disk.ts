import { Global, Module } from '@nestjs/common';
import { S3_DISK } from '../disk.constants';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import {
  CheckPresignedUrlFromAwsS3,
  CheckUploadDatasFromAwsS3,
  GetCompleteMultipartTagsFromAwsS3,
  GetDownloadUrlFromS3Client,
  GetMultipartUploadIdFromS3Bucket,
  GetPresignedUrlFromS3Bucket,
  GetPresignedUrlsFromS3Bucket,
  GetPresingendUrlsFromAwsS3,
  GetThumbnailUrlFromS3Client,
} from './adapters/disk.inbound';
import { CompleteUploadToAwsS3 } from './adapters/disk.outbound';

@Global()
@Module({
  providers: [
    ConfigService,
    {
      provide: S3_DISK,
      useFactory: (config: ConfigService) => {
        const region: string = config.get<string>('NODE_APP_AWS_REGION_NAME', 'ap-northeast-2');
        const accessKeyId: string = config.get<string>('NODE_APP_AWS_ACCESS_KEY', 'access_key');
        const secretAccessKey: string = config.get<string>(
          'NODE_APP_AWS_SECRET_KEY',
          'secretAccessKey',
        );

        return new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
    GetPresignedUrlFromS3Bucket,
    GetMultipartUploadIdFromS3Bucket,
    GetPresignedUrlsFromS3Bucket,
    CheckPresignedUrlFromAwsS3,
    CheckUploadDatasFromAwsS3,
    CompleteUploadToAwsS3,
    GetCompleteMultipartTagsFromAwsS3,
    GetPresingendUrlsFromAwsS3,
    GetDownloadUrlFromS3Client, // 다운로드에 필요한 url을 받는다.
    GetThumbnailUrlFromS3Client, // 섬네일 다운로드에 필요한 url
  ],
  exports: [
    S3_DISK,
    GetPresignedUrlFromS3Bucket,
    GetMultipartUploadIdFromS3Bucket,
    GetPresignedUrlsFromS3Bucket,
    CheckPresignedUrlFromAwsS3,
    CheckUploadDatasFromAwsS3,
    CompleteUploadToAwsS3,
    GetCompleteMultipartTagsFromAwsS3,
    GetPresingendUrlsFromAwsS3,
    GetDownloadUrlFromS3Client,
    GetThumbnailUrlFromS3Client,
  ],
})
export class S3DiskModule {}
