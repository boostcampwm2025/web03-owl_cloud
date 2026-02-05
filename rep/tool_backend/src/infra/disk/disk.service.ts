import { Inject, Injectable } from "@nestjs/common";
import { S3_DISK } from "./disk.constants";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigService } from "@nestjs/config";
import path from "path";


@Injectable()
export class DiskService {

  private readonly prefixName : string = "tool";

  constructor(
    @Inject(S3_DISK) private readonly disk : S3Client,
    private readonly config : ConfigService
  ) {}

  // upload를 하기 위한 url을 발급받는 루트
  async getUploadPresignedUrl({ pathName, mime_type } : { pathName: Array<string>; mime_type: string; }) : Promise<string> {
    const key_name : string = path.posix.join(this.prefixName, ...pathName);
    const Bucket : string = this.config.get<string>("NODE_APP_AWS_BUCKET_NAME", "bucket_name");
    const expiresIn : number = this.config.get<number>("NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC", 180);

    const command = new PutObjectCommand({
      Bucket,
      Key : key_name,
      ContentType : mime_type
    });

    const presigned_url : string = await getSignedUrl(this.disk, command, {
      expiresIn
    });

    return presigned_url;
  };

  // presigned_url check
  async checkUrl({ pathName, etag } : { pathName: Array<string>; etag: string; }) : Promise<boolean> {
    const key_name : string = path.posix.join(this.prefixName, ...pathName);
    const Bucket : string = this.config.get<string>("NODE_APP_AWS_BUCKET_NAME", "bucket_name");

    try {
      const result = await this.disk.send(
        new HeadObjectCommand({
          Bucket,
          Key : key_name
        })
      );
      if ( !result.ETag ) return false;

      // s3 형식에 맞게 수정
      const s3Etag = result.ETag.replace(/"/g, '');
      const inputEtag = etag.replace(/"/g, '');

      return s3Etag === inputEtag;
    } catch (err) {
      throw new Error(err);
    };
  };

  // img용 url
  async getDownloadUrl({ pathName }: { pathName: string[] }) : Promise<string> {
    const key_name = path.posix.join(this.prefixName, ...pathName);
    const Bucket = this.config.get<string>('NODE_APP_AWS_BUCKET_NAME', "bucket_name");
    const expiresIn = this.config.get<number>("NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC", 300); 

    const command = new GetObjectCommand({
      Bucket,
      Key: key_name,
    });

    const downloadUrl = await getSignedUrl(this.disk, command, {
      expiresIn,
    });

    return downloadUrl;
  }
};