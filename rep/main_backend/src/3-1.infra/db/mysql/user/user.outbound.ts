import { InsertValueToDb } from '@app/ports/db/db.outbound';
import { Inject, Injectable } from '@nestjs/common';
import { ResultSetHeader, type Pool } from 'mysql2/promise';
import { InsertOauthUserDataProps } from '@app/auth/commands/usecase';
import {
  DB_OAUTH_USERS_ATTRIBUTE_NAME,
  DB_TABLE_NAME,
  DB_USERS_ATTRIBUTE_NAME,
  MYSQL_DB,
} from '@infra/db/db.constants';
import { DatabaseError } from '@error/infra/infra.error';
import { OauthUserProps, UserProps } from '@domain/user/user.vo';

@Injectable()
export class InsertOauthAndUserDataToMysql extends InsertValueToDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  private async insertOauthAndUserData({
    db,
    entity,
  }: {
    db: Pool;
    entity: InsertOauthUserDataProps;
  }): Promise<boolean> {
    const connect = await db.getConnection();

    try {
      await connect.beginTransaction();

      // 현재 시간
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

      // user 정보 저장
      const userEntity: UserProps = entity.userData;
      const userTableName: string = DB_TABLE_NAME.USERS;
      const userSql: string = `
      INSERT INTO 
      \`${userTableName}\`(
      \`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`, 
      \`${DB_USERS_ATTRIBUTE_NAME.EMAIL}\`, 
      \`${DB_USERS_ATTRIBUTE_NAME.NICKNAME}\`,
      \`${DB_USERS_ATTRIBUTE_NAME.CREATED_AT}\`,
      \`${DB_USERS_ATTRIBUTE_NAME.UPDATED_AT}\`) 
      VALUES (UUID_TO_BIN(?, true), ?, ?, ?, ?)
      `;
      const [userInsertChecked] = await connect.query<ResultSetHeader>(userSql, [
        userEntity.user_id,
        userEntity.email,
        userEntity.nickname,
        now,
        now,
      ]);

      // oauth 정보 저장
      const oauthUserEntity: OauthUserProps = entity.oauthData;
      const oauthTableName: string = DB_TABLE_NAME.OAUTH_USERS;
      const oauthUserSql: string = `
      INSERT INTO
      \`${oauthTableName}\`(
      \`${DB_OAUTH_USERS_ATTRIBUTE_NAME.USER_ID}\`,
      \`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER}\`,
      \`${DB_OAUTH_USERS_ATTRIBUTE_NAME.PROVIDER_ID}\`,
      \`${DB_OAUTH_USERS_ATTRIBUTE_NAME.CREATED_AT}\`,
      \`${DB_OAUTH_USERS_ATTRIBUTE_NAME.UPDATED_AT}\`)
      VALUES (UUID_TO_BIN(?, true), ?, ?, ?, ?)
      `;
      const [oauthUserInsertChecked] = await connect.query<ResultSetHeader>(oauthUserSql, [
        oauthUserEntity.user_id,
        oauthUserEntity.provider,
        oauthUserEntity.provider_id,
        now,
        now,
      ]);

      await connect.commit();

      if (
        userInsertChecked &&
        userInsertChecked.affectedRows &&
        oauthUserInsertChecked &&
        oauthUserInsertChecked.affectedRows
      )
        return true;
      else return false;
    } catch (err) {
      if (connect) await connect.rollback();
      throw new DatabaseError(err);
    } finally {
      if (connect) connect.release();
    }
  }

  public async insert(entity: InsertOauthUserDataProps): Promise<boolean> {
    const db: Pool = this.db;

    const insertChecked = await this.insertOauthAndUserData({ db, entity });

    return insertChecked;
  }
}

@Injectable()
export class InsertUserDataToMySql extends InsertValueToDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  // 데이터 정합성을 유지해야 한다. - 트랜잭션 적용 - 한개여도 적용할 수 있다 하지만 성능적으로는 문제가 생길수도...
  public async insertUserData({
    db,
    tableName,
    entity,
  }: {
    db: Pool;
    tableName: string;
    entity: UserProps;
  }): Promise<boolean> {
    const connect = await db.getConnection();

    try {
      await connect.beginTransaction();

      const sql: string = `
      INSERT INTO \`${tableName}\`(
      \`${DB_USERS_ATTRIBUTE_NAME.USER_ID}\`,
      \`${DB_USERS_ATTRIBUTE_NAME.EMAIL}\`,
      \`${DB_USERS_ATTRIBUTE_NAME.NICKNAME}\`,
      \`${DB_USERS_ATTRIBUTE_NAME.PASSWORD_HASH}\`)
      VALUES
      (UUID_TO_BIN(?, true), ?, ?, ?)
      `;

      const [users] = await connect.query<ResultSetHeader>(sql, [
        entity.user_id,
        entity.email,
        entity.nickname,
        entity.password_hash,
      ]);

      await connect.commit();

      return users && users.affectedRows ? true : false;
    } catch (err) {
      if (connect) await connect.rollback();
      throw new DatabaseError(err);
    } finally {
      if (connect) connect.release();
    }
  }

  public async insert(entity: UserProps): Promise<boolean> {
    const db: Pool = this.db;
    const tableName: string = DB_TABLE_NAME.USERS;

    const inserChecked: boolean = await this.insertUserData({
      db,
      tableName,
      entity,
    });

    return inserChecked;
  }
}
