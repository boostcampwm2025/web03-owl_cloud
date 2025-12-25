import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, createPool } from 'mysql2/promise';
import { MYSQL_DB } from '../db.constants';
import {
  SelectUserAndOauthWhereEmailFromMysql,
  SelectUserDataFromMysql,
} from './user/user.inbound';
import {
  InsertOauthAndUserDataToMysql,
  InsertUserDataToMySql,
} from './user/user.outbound';
import { DeleteCardItemAndCardAssetDataToMysql, InsertCardAndCardStateDataToMysql, InsertCardItemAndCardAssetDataToMysql, InsertCardItemDataToMysql, UpdateCardItemAssetDataToMysql, UpdateCardItemAssetEntityToMySql } from './card/card.outbound';
import { SelectCardItemAssetFromMysql } from './card/card.inbound';

@Global()
@Module({
  providers: [
    ConfigService,

    {
      provide: MYSQL_DB,
      useFactory: async (config: ConfigService): Promise<Pool> => {
        // 데이터 베이스 관련
        const host: string = config.get<string>(
          'NODE_APP_DATABASE_HOST',
          'localhost',
        );
        const port: number = config.get<number>('NODE_APP_DATABASE_PORT', 3306);
        const database: string = config.get<string>(
          'NODE_APP_DATABASE_NAME',
          'test_db',
        );
        const user: string = config.get<string>(
          'NODE_APP_DATABASE_USER',
          'test_db_dev',
        );
        const password: string = config.get<string>(
          'NODE_APP_DATABASE_PASSWORD',
          'password',
        );

        return createPool({
          host,
          port,
          database,
          user,
          password,
          waitForConnections: true,
          connectionLimit:
            config.get<string>('NODE_ENV', 'deployment') === 'production'
              ? 10
              : 5,
          queueLimit: 0,
        });
      },
      inject: [ConfigService],
    },

    SelectUserDataFromMysql,
    SelectUserAndOauthWhereEmailFromMysql,
    InsertOauthAndUserDataToMysql,
    InsertUserDataToMySql,
    InsertCardAndCardStateDataToMysql,
    InsertCardItemDataToMysql,
    InsertCardItemAndCardAssetDataToMysql,
    DeleteCardItemAndCardAssetDataToMysql,
    UpdateCardItemAssetDataToMysql,
    SelectCardItemAssetFromMysql,
    UpdateCardItemAssetEntityToMySql
  ],
  exports: [
    MYSQL_DB,
    SelectUserDataFromMysql,
    SelectUserAndOauthWhereEmailFromMysql,
    InsertOauthAndUserDataToMysql,
    InsertUserDataToMySql,
    InsertCardAndCardStateDataToMysql,
    InsertCardItemDataToMysql,
    InsertCardItemAndCardAssetDataToMysql,
    DeleteCardItemAndCardAssetDataToMysql,
    UpdateCardItemAssetDataToMysql,
    SelectCardItemAssetFromMysql,
    UpdateCardItemAssetEntityToMySql
  ],
})
export class MysqlModule {}
