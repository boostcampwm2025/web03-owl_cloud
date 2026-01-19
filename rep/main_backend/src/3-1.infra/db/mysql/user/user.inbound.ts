import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { Inject, Injectable } from '@nestjs/common';
import { RowDataPacket, type Pool } from 'mysql2/promise';
import { type UserProps } from '@domain/user/user.vo';
import {
  DB_OAUTH_USERS_ATTRIBUTE_NAME,
  DB_TABLE_NAME,
  DB_USERS_ATTRIBUTE_NAME,
  MYSQL_DB,
} from '@infra/db/db.constants';
import { CheckOauthDataType } from '@app/auth/commands/usecase';
import { UserOauthDto } from '@app/auth/commands/dto';

// user 데이터 기본 설정
interface UserRowPacket extends RowDataPacket {
  [DB_USERS_ATTRIBUTE_NAME.USER_ID]: UserProps['user_id'];
  [DB_USERS_ATTRIBUTE_NAME.EMAIL]: UserProps['email'];
  [DB_USERS_ATTRIBUTE_NAME.NICKNAME]: UserProps['nickname'];
  [DB_USERS_ATTRIBUTE_NAME.PASSWORD_HASH]: UserProps['password_hash'];
  [DB_USERS_ATTRIBUTE_NAME.CREATED_AT]: UserProps['created_at'];
  [DB_USERS_ATTRIBUTE_NAME.UPDATED_AT]: UserProps['updated_at'];
}

@Injectable()
export class SelectUserDataFromMysql extends SelectDataFromDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  // user 데이터를 찾는 가장 간단한 방법 - connect는 사용 하지 않는다 찾는 것이니 오히려 안정성 측면
  private async selectUser({
    db,
    tableName,
    attributeName,
    attributeValue,
  }: {
    db: Pool;
    tableName: string;
    attributeName: string;
    attributeValue: any;
  }): Promise<UserRowPacket | undefined> {
    const whereClause: string =
      attributeName === DB_USERS_ATTRIBUTE_NAME.USER_ID
        ? `WHERE \`${attributeName}\` = UUID_TO_BIN(?, true)`
        : `WHERE \`${attributeName}\` = ?`;

    const sql: string = `
    SELECT 
    BIN_TO_UUID(\`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`, true) AS \`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`,
    \`${DB_USERS_ATTRIBUTE_NAME.EMAIL}\`,
    \`${DB_USERS_ATTRIBUTE_NAME.NICKNAME}\`,
    \`${DB_USERS_ATTRIBUTE_NAME.PASSWORD_HASH}\`,
    \`${DB_USERS_ATTRIBUTE_NAME.CREATED_AT}\`,
    \`${DB_USERS_ATTRIBUTE_NAME.UPDATED_AT}\`
    FROM \`${tableName}\`
    ${whereClause}
    LIMIT 1
    `;

    const [user] = await db.query<Array<UserRowPacket>>(sql, [attributeValue]);

    return user[0];
  }

  public async select({
    attributeName,
    attributeValue,
  }: {
    attributeName: string;
    attributeValue: any;
  }): Promise<UserProps | undefined> {
    const db: Pool = this.db;
    const tableName: string = DB_TABLE_NAME.USERS;

    const user = await this.selectUser({
      db,
      tableName,
      attributeName,
      attributeValue,
    });
    if (!user) return undefined;

    // 데이터가 있을때 이렇게 하기
    return {
      user_id: user[DB_USERS_ATTRIBUTE_NAME.USER_ID],
      email: user[DB_USERS_ATTRIBUTE_NAME.EMAIL],
      nickname: user[DB_USERS_ATTRIBUTE_NAME.NICKNAME],
      password_hash: user[DB_USERS_ATTRIBUTE_NAME.PASSWORD_HASH],
      created_at: user[DB_USERS_ATTRIBUTE_NAME.CREATED_AT],
      updated_at: user[DB_USERS_ATTRIBUTE_NAME.UPDATED_AT],
    };
  }
}

// user와 oauth user 데이터 찾기 기본 설정
interface UserAndOauthUserRowPacket extends RowDataPacket {
  [DB_USERS_ATTRIBUTE_NAME.USER_ID]: string;
  [DB_USERS_ATTRIBUTE_NAME.EMAIL]: string;
  [DB_USERS_ATTRIBUTE_NAME.NICKNAME]: string;
  [DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER]: string;
  [DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID]: string;
}

@Injectable()
export class SelectUserAndOauthWhereEmailFromMysql extends SelectDataFromDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  // 읽는 부분은 성능적인 부분을 신경쓰는 것이 좋다. - 로그인 이기 때문에 여기서는 caching은 하지 않을거다.
  private async selectUserAndOauthData({
    db,
    attributeName,
    attributeValue,
  }: {
    db: Pool;
    attributeName: string;
    attributeValue: string;
  }): Promise<UserAndOauthUserRowPacket | undefined> {
    const userTableName: string = DB_TABLE_NAME.USERS;
    const oauthTableName: string = DB_TABLE_NAME.OAUTH_USERS;
    const userTableNameSpace: string = 'u';
    const oauthTableNameSpace: string = 'o';

    const whereClause: string =
      attributeName === DB_USERS_ATTRIBUTE_NAME.USER_ID
        ? `WHERE \`${userTableNameSpace}\`.\`${attributeName}\` = UUID_TO_BIN(?, true)`
        : `WHERE \`${userTableNameSpace}\`.\`${attributeName}\` = ?`;

    const sql: string = `
    SELECT 
    BIN_TO_UUID(${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`) AS ${DB_USERS_ATTRIBUTE_NAME.USER_ID},
    ${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.EMAIL}\`,
    ${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.NICKNAME}\`,
    ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER}\`,
    ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID}\`
    FROM ${userTableName} ${userTableNameSpace} LEFT JOIN ${oauthTableName} ${oauthTableNameSpace} 
    ON ${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\` = ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.USER_ID}\`
    ${whereClause}
    LIMIT 1
    `;

    const [oauthAndUsers] = await db.query<Array<UserAndOauthUserRowPacket>>(sql, [attributeValue]);

    return oauthAndUsers[0];
  }

  public async select({
    attributeName,
    attributeValue,
  }: {
    attributeName: string;
    attributeValue: string;
  }): Promise<CheckOauthDataType | undefined> {
    const db: Pool = this.db;

    const oauthAndUser: UserAndOauthUserRowPacket | undefined = await this.selectUserAndOauthData({
      db,
      attributeName,
      attributeValue,
    });
    if (!oauthAndUser) return undefined;

    return {
      user_id: oauthAndUser[DB_USERS_ATTRIBUTE_NAME.USER_ID],
      email: oauthAndUser[DB_USERS_ATTRIBUTE_NAME.EMAIL],
      nickname: oauthAndUser[DB_USERS_ATTRIBUTE_NAME.NICKNAME],
      provider: oauthAndUser[DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER],
      provider_id: oauthAndUser[DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID],
    };
  }
}

// 새로운 oauth에서 데이터 정보를 파싱하는 객체
@Injectable()
export class SelectUserAndOauthFromMysql extends SelectDataFromDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  // 읽는 부분은 성능적인 부분을 신경쓰는 것이 좋다. - 로그인 이기 때문에 여기서는 caching은 하지 않을거다.
  private async selectUserAndOauthData({
    db,
    attributeName,
    attributeValue,
  }: {
    db: Pool;
    attributeName: string;
    attributeValue: UserOauthDto;
  }): Promise<UserAndOauthUserRowPacket | undefined> {
    const userTableName: string = DB_TABLE_NAME.USERS;
    const oauthTableName: string = DB_TABLE_NAME.OAUTH_USERS;
    const userTableNameSpace: string = 'u';
    const oauthTableNameSpace: string = 'o';

    const sql: string = `
      SELECT 
        BIN_TO_UUID(${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`, true) AS \`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`,
        ${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.EMAIL}\` AS \`${DB_USERS_ATTRIBUTE_NAME.EMAIL}\`,
        ${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.NICKNAME}\` AS \`${DB_USERS_ATTRIBUTE_NAME.NICKNAME}\`,
        ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER}\` AS \`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER}\`,
        ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID}\` AS \`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID}\`
      FROM ${oauthTableName} ${oauthTableNameSpace}
      JOIN ${userTableName} ${userTableNameSpace}
        ON ${userTableNameSpace}.\`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\` = ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.USER_ID}\`
      WHERE ${userTableNameSpace}.\`${attributeName}\` = ?
        AND ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER}\` = ?
        AND ${oauthTableNameSpace}.\`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID}\` = ?
      LIMIT 1
    `;

    const params = [attributeValue.email, attributeValue.provider, attributeValue.provider_id];

    const [rows] = await db.query<Array<UserAndOauthUserRowPacket>>(sql, params);
    return rows[0];
  }

  public async select({
    attributeName,
    attributeValue,
  }: {
    attributeName: string;
    attributeValue: UserOauthDto;
  }): Promise<CheckOauthDataType | undefined> {
    const db: Pool = this.db;

    const oauthAndUser: UserAndOauthUserRowPacket | undefined = await this.selectUserAndOauthData({
      db,
      attributeName,
      attributeValue,
    });
    if (!oauthAndUser) return undefined;

    return {
      user_id: oauthAndUser[DB_USERS_ATTRIBUTE_NAME.USER_ID],
      email: oauthAndUser[DB_USERS_ATTRIBUTE_NAME.EMAIL],
      nickname: oauthAndUser[DB_USERS_ATTRIBUTE_NAME.NICKNAME],
      provider: oauthAndUser[DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER],
      provider_id: oauthAndUser[DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID],
    };
  }
}
