import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { Inject, Injectable } from '@nestjs/common';
import { RowDataPacket, type Pool } from 'mysql2/promise';
import {
  DB_ROOMS_ATTRIBUTE_NAME,
  DB_TABLE_NAME,
  DB_USERS_ATTRIBUTE_NAME,
  MYSQL_DB,
} from '../../db.constants';
import { RoomProps } from '@domain/room/vo';
import { GetRoomInfoDbResult } from '@/2.application/room/queries/dto';

interface RoomDataPacket extends RowDataPacket {
  [DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID]: string;
  [DB_ROOMS_ATTRIBUTE_NAME.CODE]: string;
  [DB_ROOMS_ATTRIBUTE_NAME.TITLE]: string;
  [DB_ROOMS_ATTRIBUTE_NAME.PASSWORD_HASH]: string | null;
  [DB_ROOMS_ATTRIBUTE_NAME.OWNER_USER_ID]: string;
  [DB_ROOMS_ATTRIBUTE_NAME.MAX_PARTICIPANTS]: number;
  [DB_ROOMS_ATTRIBUTE_NAME.STATUS]: 'open' | 'closed';
}
@Injectable()
export class SelectRoomDataFromMysql extends SelectDataFromDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  private async selectData({
    db,
    tableName,
    code,
  }: {
    db: Pool;
    tableName: string;
    code: string;
  }): Promise<RoomProps | undefined> {
    const sql: string = `
    SELECT
    BIN_TO_UUID(\`${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID}\`, true) AS ${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID},
    \`${DB_ROOMS_ATTRIBUTE_NAME.CODE}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.TITLE}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.PASSWORD_HASH}\`,
    BIN_TO_UUID(\`${DB_ROOMS_ATTRIBUTE_NAME.OWNER_USER_ID}\`, true) AS ${DB_ROOMS_ATTRIBUTE_NAME.OWNER_USER_ID},
    \`${DB_ROOMS_ATTRIBUTE_NAME.MAX_PARTICIPANTS}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.STATUS}\`
    FROM
    \`${tableName}\`
    WHERE 
      \`${DB_ROOMS_ATTRIBUTE_NAME.CODE}\` = ? AND
      \`${DB_ROOMS_ATTRIBUTE_NAME.STATUS}\` = 'open' AND 
      \`${DB_ROOMS_ATTRIBUTE_NAME.DELETED_AT}\` IS NULL
    LIMIT 1 
    `;

    const [roomRows] = await db.query<Array<RoomDataPacket>>(sql, [code]);

    return roomRows && roomRows[0]
      ? {
          ...roomRows[0],
        }
      : undefined;
  }

  // attributeValue만 현재 room에 code가 존재한다.
  async select({
    attributeName,
    attributeValue,
  }: {
    attributeName: string;
    attributeValue: string;
  }): Promise<RoomProps | undefined> {
    const db: Pool = this.db;
    const tableName: string = DB_TABLE_NAME.ROOMS;

    const roomData: RoomProps | undefined = await this.selectData({
      db,
      tableName,
      code: attributeValue,
    });
    return roomData;
  }
}

// room_id 정보 가져오기
interface RoomIdPacket extends RowDataPacket {
  [DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID]: string;
  [DB_USERS_ATTRIBUTE_NAME.NICKNAME]: string;
  [DB_ROOMS_ATTRIBUTE_NAME.TITLE]: string;
  [DB_ROOMS_ATTRIBUTE_NAME.PASSWORD_HASH]: string | null;
}
@Injectable()
export class SelectRoomIdFromMysql extends SelectDataFromDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  async selectData({
    db,
    code,
  }: {
    db: Pool;
    code: string;
  }): Promise<GetRoomInfoDbResult | undefined> {
    const roomTableName: string = DB_TABLE_NAME.ROOMS;
    const roomNamespace: string = 'rs';

    const userTableName: string = DB_TABLE_NAME.USERS;
    const userNamespace: string = 'un';

    const sql: string = `
    SELECT 
    BIN_TO_UUID(${roomNamespace}.\`${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID}\`, true) AS \`${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID}\`,
    ${userNamespace}.\`${DB_USERS_ATTRIBUTE_NAME.NICKNAME}\`,
    ${roomNamespace}.\`${DB_ROOMS_ATTRIBUTE_NAME.TITLE}\`,
    ${roomNamespace}.\`${DB_ROOMS_ATTRIBUTE_NAME.PASSWORD_HASH}\`
    FROM \`${roomTableName}\` ${roomNamespace} INNER JOIN \`${userTableName}\` ${userNamespace} ON
    ${roomNamespace}.\`${DB_ROOMS_ATTRIBUTE_NAME.OWNER_USER_ID}\` = ${userNamespace}.\`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`
    WHERE 
      ${roomNamespace}.\`${DB_ROOMS_ATTRIBUTE_NAME.CODE}\` = ? AND
      ${roomNamespace}.\`${DB_ROOMS_ATTRIBUTE_NAME.STATUS}\` = 'open' AND 
      ${roomNamespace}.\`${DB_ROOMS_ATTRIBUTE_NAME.DELETED_AT}\` IS NULL
    LIMIT 1 
    `;

    const [result] = await db.query<Array<RoomIdPacket>>(sql, [code]);

    return result[0]
      ? {
          host_nickname: result[0][DB_USERS_ATTRIBUTE_NAME.NICKNAME],
          title: result[0][DB_ROOMS_ATTRIBUTE_NAME.TITLE],
          room_id: result[0][DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID],
          has_password: result[0][DB_ROOMS_ATTRIBUTE_NAME.PASSWORD_HASH] !== null,
        }
      : undefined;
  }

  // attributeValue는 code 이다.
  async select({
    attributeName,
    attributeValue,
  }: {
    attributeName: string;
    attributeValue: string;
  }): Promise<GetRoomInfoDbResult | undefined> {
    const db: Pool = this.db;
    const code: string = attributeValue;

    const roomInfo: GetRoomInfoDbResult | undefined = await this.selectData({ db, code });

    return roomInfo;
  }
}
