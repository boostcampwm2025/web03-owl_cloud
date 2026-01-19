import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, createPool } from 'mysql2/promise';
import { MYSQL_DB } from '../db.constants';
import {
  SelectUserAndOauthFromMysql,
  SelectUserAndOauthWhereEmailFromMysql,
  SelectUserDataFromMysql,
} from './user/user.inbound';
import { InsertOauthAndUserDataToMysql, InsertUserDataToMySql } from './user/user.outbound';
import {
  DeleteHardRoomParticipantInfoDataToMysql,
  DeleteRoomDataToMysql,
  InsertRoomDataToMysql,
  InsertRoomParticipantInfoDataToMysql,
  UpdateRoomParticipantInfoToMysql,
} from './room/room.outbound';
import { SelectRoomDataFromMysql, SelectRoomIdFromMysql } from './room/room.inbound';

@Global()
@Module({
  providers: [
    ConfigService,

    {
      provide: MYSQL_DB,
      useFactory: async (config: ConfigService): Promise<Pool> => {
        // 데이터 베이스 관련
        const host: string = config.get<string>('NODE_APP_DATABASE_HOST', 'localhost');
        const port: number = config.get<number>('NODE_APP_DATABASE_PORT', 3306);
        const database: string = config.get<string>('NODE_APP_DATABASE_NAME', 'test_db');
        const user: string = config.get<string>('NODE_APP_DATABASE_USER', 'test_db_dev');
        const password: string = config.get<string>('NODE_APP_DATABASE_PASSWORD', 'password');

        return createPool({
          host,
          port,
          database,
          user,
          password,
          waitForConnections: true,
          connectionLimit: config.get<string>('NODE_ENV', 'deployment') === 'production' ? 10 : 5,
          queueLimit: 0,
        });
      },
      inject: [ConfigService],
    },

    SelectUserDataFromMysql,
    SelectUserAndOauthWhereEmailFromMysql,
    InsertOauthAndUserDataToMysql,
    InsertUserDataToMySql,
    InsertRoomDataToMysql,
    DeleteRoomDataToMysql,
    SelectRoomDataFromMysql,
    InsertRoomParticipantInfoDataToMysql,
    DeleteHardRoomParticipantInfoDataToMysql, // 에러가 발생했을때 그 방문기록을 하드 삭제하기 위한 객체
    UpdateRoomParticipantInfoToMysql, // 회의방에 참가자 떠났다는 정보 기입
    SelectUserAndOauthFromMysql, // oauth에서 유저의 정보를 찾아주는
    SelectRoomIdFromMysql, // room_id를 찾아주는
  ],
  exports: [
    MYSQL_DB,
    SelectUserDataFromMysql,
    SelectUserAndOauthWhereEmailFromMysql,
    InsertOauthAndUserDataToMysql,
    InsertUserDataToMySql,
    InsertRoomDataToMysql,
    DeleteRoomDataToMysql,
    SelectRoomDataFromMysql,
    InsertRoomParticipantInfoDataToMysql,
    DeleteHardRoomParticipantInfoDataToMysql,
    UpdateRoomParticipantInfoToMysql,
    SelectUserAndOauthFromMysql,
    SelectRoomIdFromMysql,
  ],
})
export class MysqlModule {}
