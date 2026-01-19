import { DeleteValueToDb, InsertValueToDb, UpdateValueToDb } from '@app/ports/db/db.outbound';
import { Inject, Injectable } from '@nestjs/common';
import { ResultSetHeader, type Pool } from 'mysql2/promise';
import {
  DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME,
  DB_ROOMS_ATTRIBUTE_NAME,
  DB_TABLE_NAME,
  MYSQL_DB,
} from '../../db.constants';
import { RoomParticipantProps, RoomProps } from '@domain/room/vo';

// mysql에 room에 대한 데이터 저장
@Injectable()
export class InsertRoomDataToMysql extends InsertValueToDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  private async insertData({
    db,
    tableName,
    entity,
  }: {
    db: Pool;
    tableName: string;
    entity: Required<RoomProps>;
  }): Promise<boolean> {
    const sql: string = `
    INSERT INTO \`${tableName}\`(
    \`${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.CODE}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.TITLE}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.PASSWORD_HASH}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.OWNER_USER_ID}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.MAX_PARTICIPANTS}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.STATUS}\`)
    VALUES (UUID_TO_BIN(?, true), ?, ?, ?, UUID_TO_BIN(?, true), ?, ?)
    `;
    const values: Array<any> = [
      entity.room_id,
      entity.code,
      entity.title,
      entity.password_hash,
      entity.owner_user_id,
      entity.max_participants,
      entity.status,
    ];

    const [result] = await db.execute<ResultSetHeader>(sql, values);

    return result && result.affectedRows ? true : false;
  }

  async insert(entity: Required<RoomProps>): Promise<boolean> {
    const db: Pool = this.db;
    const tableName: string = DB_TABLE_NAME.ROOMS;

    const inserted: boolean = await this.insertData({ db, tableName, entity });

    return inserted;
  }
}

@Injectable()
export class DeleteRoomDataToMysql extends DeleteValueToDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  private async deleteData({
    db,
    tableName,
    uniqueValue,
  }: {
    db: Pool;
    tableName: string;
    uniqueValue: string;
  }): Promise<boolean> {
    const sql: string = `
    DELETE FROM \`${tableName}\`
    WHERE \`${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID}\` = UUID_TO_BIN(?, true)
    `;

    const [result] = await db.execute<ResultSetHeader>(sql, [uniqueValue]);

    return result && result.affectedRows ? true : false;
  }

  // room_id가 uniqueValue
  async delete({
    uniqueValue,
    addOption,
  }: {
    uniqueValue: string;
    addOption: undefined;
  }): Promise<boolean> {
    const db: Pool = this.db;
    const tableName: string = DB_TABLE_NAME.ROOMS;

    await this.deleteData({ db, tableName, uniqueValue });

    return true;
  }
}

@Injectable()
export class InsertRoomParticipantInfoDataToMysql extends InsertValueToDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  private async insertData({
    db,
    tableName,
    entity,
  }: {
    db: Pool;
    tableName: string;
    entity: RoomParticipantProps;
  }): Promise<boolean> {
    // 해당 user_id, room_id가
    const sql = `
    INSERT INTO \`${tableName}\` (
      \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.ROOM_ID}\`,
      \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.USER_ID}\`
    )
    SELECT
      UUID_TO_BIN(?, true),
      UUID_TO_BIN(?, true)
    FROM DUAL
    WHERE NOT EXISTS (
      SELECT 1
      FROM \`${tableName}\`
      WHERE
        \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.ROOM_ID}\` = UUID_TO_BIN(?, true)
        AND \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.USER_ID}\` = UUID_TO_BIN(?, true)
        AND \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.LEFT_AT}\` IS NULL
    );
    `;

    const [result] = await db.execute<ResultSetHeader>(sql, [
      entity.room_id,
      entity.user_id,
      entity.room_id,
      entity.user_id,
    ]);

    return result && result.affectedRows ? true : false;
  }

  async insert(entity: RoomParticipantProps): Promise<boolean> {
    const db = this.db;
    const tableName: string = DB_TABLE_NAME.ROOM_PARTICIPANTS;

    const inserted: boolean = await this.insertData({ db, tableName, entity });

    return inserted;
  }
}

// 이건 에러가 발생했을때 삭제를 진행하는 것이다.
@Injectable()
export class DeleteHardRoomParticipantInfoDataToMysql extends DeleteValueToDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  private async deleteData({
    db,
    tableName,
    room_id,
    user_id,
  }: {
    db: Pool;
    tableName: string;
    room_id: string;
    user_id: string;
  }): Promise<boolean> {
    // 하드 삭제
    const sql: string = `
    DELETE FROM \`${tableName}\`
    WHERE \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.ROOM_ID}\` = UUID_TO_BIN(?, true) AND
    \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.USER_ID}\` = UUID_TO_BIN(?, true) AND 
    \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.LEFT_AT}\` IS NULL
    LIMIT 1
    `;

    const [result] = await db.execute<ResultSetHeader>(sql, [room_id, user_id]);

    return result && result.affectedRows ? true : false;
  }

  // uniqueValue는 room_id이고 addOption은 user_id이다.
  async delete({
    uniqueValue,
    addOption,
  }: {
    uniqueValue: string;
    addOption: string;
  }): Promise<boolean> {
    const db = this.db;
    const tableName: string = DB_TABLE_NAME.ROOM_PARTICIPANTS;
    const deleted: boolean = await this.deleteData({
      db,
      tableName,
      room_id: uniqueValue,
      user_id: addOption,
    });
    return deleted;
  }
}

// 이건 이제 퇴장했다는 것을 업데이트 함 소프트 삭제는 좀 애매하고 이에 대해서 수정
@Injectable()
export class UpdateRoomParticipantInfoToMysql extends UpdateValueToDb<Pool> {
  constructor(@Inject(MYSQL_DB) db: Pool) {
    super(db);
  }

  private async updateData({
    db,
    tableName,
    room_id,
    user_id,
  }: {
    db: Pool;
    tableName: string;
    room_id: string;
    user_id: string;
  }): Promise<boolean> {
    const sql: string = `
    UPDATE \`${tableName}\`
    SET \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.LEFT_AT}\` = CURRENT_TIMESTAMP
    WHERE \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.ROOM_ID}\` = UUID_TO_BIN(?, true) AND
    \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.USER_ID}\` = UUID_TO_BIN(?, true) AND
    \`${DB_ROOM_PARTICIPANTS_ATTRIBUTE_NAME.LEFT_AT}\` IS NULL
    LIMIT 1
    `;

    const [result] = await db.execute<ResultSetHeader>(sql, [room_id, user_id]);

    return result && result.affectedRows ? true : false;
  }

  // uniqueValue는 room_id 이고 updateValue는 user_id 이다.
  async update({
    uniqueValue,
    updateColName,
    updateValue,
  }: {
    uniqueValue: string;
    updateColName: string;
    updateValue: string;
  }): Promise<boolean> {
    const db: Pool = this.db;
    const tableName: string = DB_TABLE_NAME.ROOM_PARTICIPANTS;
    const updated: boolean = await this.updateData({
      db,
      tableName,
      room_id: uniqueValue,
      user_id: updateValue,
    });
    return updated;
  }
}
