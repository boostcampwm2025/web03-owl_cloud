import { Module } from '@nestjs/common';
import { CodeeditorService } from './codeeditor.service';
import { CodeeditorWebsocketGateway } from './codeeditor.gateway';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [ConfigService, CodeeditorService, CodeeditorWebsocketGateway],
})
export class CodeeditorModule {}
