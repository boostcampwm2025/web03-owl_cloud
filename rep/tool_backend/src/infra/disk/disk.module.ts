import { Global, Module } from "@nestjs/common";
import { S3_DISK } from "./disk.constants";
import { ConfigService } from "@nestjs/config";
import { S3Client } from "@aws-sdk/client-s3";
import { DiskService } from "./disk.service";


@Global()
@Module({
  providers : [
    ConfigService,
    // s3와 관련된 모듈
    {
      provide : S3_DISK,
      useFactory : (
        config : ConfigService
      ) => {
        const region : string = config.get<string>("NODE_APP_AWS_REGION_NAME", "ap-northeast-2");
        const accessKeyId : string = config.get<string>("NODE_APP_AWS_ACCESS_KEY", "access_key");
        const secretAccessKey : string = config.get<string>("NODE_APP_AWS_SECRET_KEY", "secretAccessKey");
        
        return new S3Client({
          region,
          credentials : {
            accessKeyId, secretAccessKey
          }
        });
      },
      inject : [
        ConfigService
      ]
    },
    DiskService
  ],
  exports : [
    S3_DISK,
    DiskService
  ]
})
export class DiskModule {};