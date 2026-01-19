import { Global, Module } from '@nestjs/common';
import { MYSQL_DB } from '../db.constants';
import { ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';

@Global()
@Module({
  providers: [
    ConfigService,
    {
      provide: MYSQL_DB,
      useFactory: async (config: ConfigService) => {
        // 데이터 베이스 관련
        const host: string = config.get<string>('NODE_APP_DATABASE_HOST', 'localhost');
        const port: number = config.get<number>('NODE_APP_DATABASE_PORT', 3306);
        const database: string = config.get<string>('NODE_APP_DATABASE_NAME', 'local_db');
        const user: string = config.get<string>('NODE_APP_DATABASE_USER', 'local_db_dev');
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
  ],
  exports: [MYSQL_DB],
})
export class MysqlModule {}
