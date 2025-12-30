import { DeleteValuesToDb, DeleteValueToDb, InsertValueToDb, UpdateValuesToDb, UpdateValueToDb } from "@app/ports/db/db.outbound";
import { Inject, Injectable } from "@nestjs/common";
import { PoolConnection, ResultSetHeader, type Pool } from "mysql2/promise";
import { DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME, DB_CARD_ITEMS_ATTRIBUTE_NAME, DB_CARD_STATS_ATTRIBUTE_NAME, DB_CARDS_ATTRIBUTE_NAME, DB_TABLE_NAME, MYSQL_DB } from "../../db.constants";
import { InsertCardAndCardStateDataProps, InsertCardItemAndAssetDataProps } from "@app/card/commands/usecase";
import { DatabaseError } from "@error/infra/infra.error";
import { CardItemProps } from "@domain/card/vo";
import { NotFoundRefereceError, NotInsertDatabaseError } from "@error/infra/card/card.error";
import { UpdateCardInputDto, UpdateCardItemAssetValueProps, UpdateCardItemDto } from "@app/card/commands/dto";


@Injectable()
export class InsertCardAndCardStateDataToMysql extends InsertValueToDb<Pool> {
  
  constructor(@Inject(MYSQL_DB) db : Pool ) { super(db); };

  private async insertData({
    db, entity
  } : {
    db : Pool, entity : InsertCardAndCardStateDataProps
  }) : Promise<boolean> {

    const connect = await db.getConnection();

    try {

      await connect.beginTransaction();

      // card 저장
      const cardTableName : string = DB_TABLE_NAME.CARDS;
      const cardSql : string = `
      INSERT INTO \`${cardTableName}\`(
      \`${DB_CARDS_ATTRIBUTE_NAME.CARD_ID}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.USER_ID}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.CATEGORY_ID}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.STATUS}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.TITLE}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_WIDTH}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_HEIGHT}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.BACKGROUND_COLOR}\`
      )
      VALUES (UUID_TO_BIN(?, true), UUID_TO_BIN(?, true), ?, ?, ?, ?, ?, ?)
      `;

      const cardData = entity.card;
      const [ cardInsert ] = await connect.query<ResultSetHeader>(cardSql, [ 
        cardData.card_id, 
        cardData.user_id, 
        cardData.category_id, 
        cardData.status,
        cardData.title,
        cardData.workspace_width,
        cardData.workspace_height,
        cardData.background_color
      ]);

      // card_stat 저장
      const cardStatTableName : string = DB_TABLE_NAME.CARD_STATS;
      const cardStatSql : string = `
      INSERT INTO \`${cardStatTableName}\`(
      \`${DB_CARD_STATS_ATTRIBUTE_NAME.CARD_ID}\`
      )
      VALUES (UUID_TO_BIN(?, true))
      `;

      const cardStat = entity.cardState;
      const [ cardStatInsert ] = await connect.query<ResultSetHeader>(cardStatSql, [ cardStat.card_id ]);
 
      await connect.commit();

      return cardInsert && cardInsert.affectedRows && cardStatInsert && cardStatInsert.affectedRows ? true : false;
    } catch (err) {
      if ( connect ) await connect.rollback();
      throw new DatabaseError(err);
    } finally {
      if ( connect ) connect.release();
    };

  };

  public async insert(entity: InsertCardAndCardStateDataProps): Promise<boolean> {
    
    const db = this.db;

    const insertChecked : boolean = await this.insertData({ db, entity });

    return insertChecked;
  };

};

@Injectable()
export class InsertCardItemDataToMysql extends InsertValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  // 데이터를 insert 하는데 필요한 내부 함수
  private async insertData({
    db, tableName, entity
  } : {
    db : Pool, tableName : string, entity : Required<CardItemProps>
  }) : Promise<boolean> {

    const columns : Array<string> = [
      DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.TYPE,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.X,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.Y,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.WIDTH,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.ROTATION,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_X,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_Y,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.OPTION
    ];

    const values : Array<any> = [
      entity.item_id,
      entity.card_id,
      entity.type,
      entity.x,
      entity.y,
      entity.width,
      entity.rotation,
      entity.scale_x,
      entity.scale_y,
      JSON.stringify(entity.option),
    ];

    const optional: Array<[string, any]> = [
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.HEIGHT, entity.height],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.OPACITY, entity.opacity],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.Z_INDEX, entity.z_index],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_LOCKED, entity.is_locked],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_VISIBLE, entity.is_visible],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.NAME, entity.name],
    ];

    optional.forEach(([ col, val ]) => {
      if ( val !== undefined ) {
        columns.push(col);
        values.push(val);
      };
    });

    const colSql = columns.map((c) => `\`${c}\``).join(", ");
    const placeholders = columns.map((c) => {
      if ( c === DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID || c === DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID ) return "UUID_TO_BIN(?, true)"
      else return "?"
    }).join(", ");

    try {
      const sql : string = `INSERT INTO \`${tableName}\` (${colSql}) VALUES (${placeholders})`;

      const [ result ] = await db.query<ResultSetHeader>(sql, values);
      return result?.affectedRows ? true : false;
    } catch (err) {
      if ( err?.code === "ER_NO_REFERENCED_ROW_2" || err?.errno === 1452 ) {
        throw new NotFoundRefereceError("card_id를 찾을 수 없습니다. 다시 확인해주세요");
      }
      throw new DatabaseError(err);
    };
  };

  // card_item을 insert 하는데 필요한 함수 
  public async insert(entity: Required<CardItemProps>): Promise<boolean> {
    
    const db : Pool = this.db;
    const tableName : string = DB_TABLE_NAME.CARD_ITEMS;

    const insertChecked : boolean = await this.insertData({ db, tableName, entity });

    return insertChecked;
  };

};

@Injectable()
export class InsertCardItemAndCardAssetDataToMysql extends InsertValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  private async insertData({
    db, entity
  } : {
    db : Pool, entity : InsertCardItemAndAssetDataProps
  }) : Promise<boolean> {

    const connection = await db.getConnection();

    try {
      
      await connection.beginTransaction();

      // card_item 테이블 
      const cardItemEntity : Required<CardItemProps> = entity.cardItem;

      const cardItemColumns : Array<string> = [
        DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.TYPE,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.X,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.Y,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.WIDTH,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.ROTATION,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_X,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_Y,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.OPTION,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.CREATED_AT,
        DB_CARD_ITEMS_ATTRIBUTE_NAME.UPDATED_AT
      ];

      const cardItemValues : Array<any> = [
        cardItemEntity.item_id,
        cardItemEntity.card_id,
        cardItemEntity.type,
        cardItemEntity.x,
        cardItemEntity.y,
        cardItemEntity.width,
        cardItemEntity.rotation,
        cardItemEntity.scale_x,
        cardItemEntity.scale_y,
        JSON.stringify(cardItemEntity.option),
        cardItemEntity.created_at,
        cardItemEntity.updated_at
      ];

      const cardItemOptional: Array<[string, any]> = [
        [DB_CARD_ITEMS_ATTRIBUTE_NAME.HEIGHT, cardItemEntity.height],
        [DB_CARD_ITEMS_ATTRIBUTE_NAME.OPACITY, cardItemEntity.opacity],
        [DB_CARD_ITEMS_ATTRIBUTE_NAME.Z_INDEX, cardItemEntity.z_index],
        [DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_LOCKED, cardItemEntity.is_locked],
        [DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_VISIBLE, cardItemEntity.is_visible],
        [DB_CARD_ITEMS_ATTRIBUTE_NAME.NAME, cardItemEntity.name],
      ];

      cardItemOptional.forEach(([col, val]) => {
        if ( val !== undefined ) {
          cardItemColumns.push(col);
          cardItemValues.push(val);
        };
      });

      const cardItemColSql = cardItemColumns.map((c) => `\`${c}\``).join(", ");
      const cardItemPlaceholders = cardItemColumns.map((c) => {
        if ( c === DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID || c === DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID ) return "UUID_TO_BIN(?, true)";
        else return "?";
      }).join(", ");

      const cardItemTable : string = DB_TABLE_NAME.CARD_ITEMS;
      const cardItemSql : string = `INSERT INTO \`${cardItemTable}\` (${cardItemColSql}) VALUES (${cardItemPlaceholders})`;

      const [ cardItemResult ] = await connection.query<ResultSetHeader>(cardItemSql, cardItemValues);

      // card_item_asset 저장
      const cardItemAssetTableName: string = DB_TABLE_NAME.CARD_ITEM_ASSETS;
      const cardItemAssetSql : string = `
      INSERT INTO \`${cardItemAssetTableName}\` (
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID}\`,
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.KEY_NAME}\`,
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.MIME_TYPE}\`,
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.SIZE}\`,
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS}\`,
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CARD_ID}\`,
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CREATED_AT}\`,
      \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.UPDATED_AT}\`)
      VALUES (UUID_TO_BIN(?, true), ?, ?, ?, ?, UUID_TO_BIN(?, true), ?, ?)`;

      const cardItemAssetEntity = entity.cardAsset;
      const [ cardItemAssetResult ] = await connection.query<ResultSetHeader>(cardItemAssetSql, [
        cardItemAssetEntity.item_id, cardItemAssetEntity.key_name, cardItemAssetEntity.mime_type, cardItemAssetEntity.size,
        cardItemAssetEntity.status, cardItemAssetEntity.card_id, cardItemAssetEntity.created_at, cardItemAssetEntity.updated_at
      ]);

      // insert zero인 경우를 보호하는 것이 좋기는 하다. 
      if ( !cardItemResult?.affectedRows ) throw new NotInsertDatabaseError("card_item");
      if ( !cardItemAssetResult?.affectedRows ) throw new NotInsertDatabaseError("card_item_asset");

      await connection.commit();

      return cardItemResult && cardItemResult.affectedRows && cardItemAssetResult && cardItemAssetResult.affectedRows ? true : false;
    } catch (err) {
      if ( connection ) await connection.rollback();

      // card_item이 존재하지 않아서 생기는 에러
      if ( err?.code === "ER_NO_REFERENCED_ROW_2" || err?.errno === 1452 ) {
        throw new NotFoundRefereceError("card_id를 찾을 수 없습니다. 다시 확인해주세요");
      }

      throw new DatabaseError(err);
    } finally {
      if ( connection ) connection.release();
    };

  };

  public async insert(entity: InsertCardItemAndAssetDataProps): Promise<boolean> {
    
    const db : Pool = this.db;

    const insertChecked : boolean = await this.insertData({ db, entity });

    return insertChecked;
  };

};

// card_item, asset 제거 함수 -> 이 코드는 실제 하드 삭제인 이유는 이 코드가 쓰이는 곳이 오류가 발생했을때 삭제하는 것이기 때문이다. 
@Injectable()
export class DeleteCardItemAndCardAssetDataToMysql extends DeleteValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  private async deleteData({
    db, uniqueValue
  }: {
    db : Pool, uniqueValue : string
  }) : Promise<boolean> {

    const connection = await db.getConnection();

    try {

      await connection.beginTransaction();

      const cardItemAssetTable : string = DB_TABLE_NAME.CARD_ITEM_ASSETS;

      const cardItemAssetSql : string = `
      DELETE FROM \`${cardItemAssetTable}\`
      WHERE \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID}\` = UUID_TO_BIN(?, true)
      `;

      const [ deleteCardItemAssetChecked ] = await connection.query<ResultSetHeader>(cardItemAssetSql, [ uniqueValue ]);

      const cardItemTable : string = DB_TABLE_NAME.CARD_ITEMS;

      const cardItemSql : string = `
      DELETE FROM \`${cardItemTable}\`
      WHERE \`${DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID}\` = UUID_TO_BIN(?, true)
      `;

      const [ deleteCardItemChekced ] = await connection.query<ResultSetHeader>(cardItemSql, [ uniqueValue ]);

      await connection.commit();

      return deleteCardItemChekced && deleteCardItemAssetChecked ? true : false;
    } catch (err) {
      if ( connection ) await connection.rollback();
      throw new DatabaseError(err);
    } finally {
      if ( connection ) connection.release();
    };

  };

  async delete({ uniqueValue, addOption }: { uniqueValue: string; addOption: undefined; }): Promise<boolean> {
    
    const db : Pool = this.db;

    const deleteChecked : boolean = await this.deleteData({ db, uniqueValue });

    return deleteChecked;
  };
};

// card_item_asset을 item_id를 이용해서 찾고 데이터를 수정하는 로직
@Injectable()
export class UpdateCardItemAssetDataToMysql extends UpdateValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  // 데이터 업데이트 로직
  private async updateData({
    db, tableName, uniqueName, uniqueValue, updateColName, updateValue
  } : {
    db : Pool; tableName : string; uniqueName : string; uniqueValue : string; updateColName : string; updateValue : any;
  }) : Promise<boolean> {

    const sql : string = `
    UPDATE \`${tableName}\`
    SET \`${updateColName}\` = ?
    WHERE \`${uniqueName}\` = UUID_TO_BIN(?, true)
    `;

    const [ updateCheck ] = await db.query<ResultSetHeader>(sql, [ updateValue, uniqueValue ]);

    return updateCheck && updateCheck.affectedRows ? true : false;
  };

  // 데이터를 업데이트 하는 로직
  async update({ uniqueValue, updateColName, updateValue }: { uniqueValue: string; updateColName : string; updateValue: any; }): Promise<boolean> {

    const db = this.db;
    const tableName : string = DB_TABLE_NAME.CARD_ITEM_ASSETS;
    const uniqueName : string = DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID;

    const updateChecked : boolean = await this.updateData({ db, tableName, uniqueName, uniqueValue, updateColName, updateValue });

    return updateChecked;
  };

};

// card_item_asset에 각 값을 변경시키는 로직
@Injectable()
export class UpdateCardItemAssetEntityToMySql extends UpdateValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  private async updateData({
    db, tableName, uniqueName, uniqueValue, updateValue
  } : {
    db : Pool, tableName : string, uniqueName : string, uniqueValue : string, updateValue :  UpdateCardItemAssetValueProps
  }) : Promise<boolean> {


    const colNameMapping  = {
      key_name: DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.KEY_NAME,
      mime_type: DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.MIME_TYPE,
      size: DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.SIZE,
      status: DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS
    } as const;

    type UpdateKey = keyof typeof colNameMapping;
    const updateValueKeys = Object.keys(updateValue) as Array<UpdateKey> ; //key들을 받아올 수 있다. 

    const colNames : Array<string> = [];
    const colValues : Array<string | number> = [];

    // update용 key중에서 값이 있으면 col에 넣어서 수정하기 
    updateValueKeys.forEach(( updateValueKey : UpdateKey ) => {
      
      const existKey = colNameMapping[updateValueKey]
      const updateV = updateValue[updateValueKey];

      if ( existKey !== undefined && updateV !== undefined ) {
        colNames.push( colNameMapping[updateValueKey] ); // 업데이트할 열 이름
        colValues.push(updateV); // 업데이트할 값 
      }
    });

    if ( colNames.length === 0 ) return true;

    colValues.push(uniqueValue); // 마지막에는 item_id 추가 

    const setColNames = colNames.map(colName => `\`${colName}\` = ?`).join(",\n");
    const sql : string = 
    `UPDATE \`${tableName}\`\n` +
    `SET\n${setColNames}\n` +
    `WHERE \`${uniqueName}\` = UUID_TO_BIN(?, true)`;

    const [ result ] = await db.query<ResultSetHeader>(sql, colValues);

    return result && result.affectedRows ? true : false;
  }

  async update({ uniqueValue, updateColName, updateValue }: { uniqueValue: string; updateColName: string; updateValue: UpdateCardItemAssetValueProps; }): Promise<boolean> {
    
    const db = this.db;
    const tableName : string = DB_TABLE_NAME.CARD_ITEM_ASSETS;
    const uniqueName: string = DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID;

    const updated : boolean = await this.updateData({ db, tableName, uniqueName, uniqueValue, updateValue }); // 값 업데이트 확인

    return updated;
  }

};

// card_stat에 조회수, 좋아요 같은 값을 변하게 해주는 로직 
@Injectable()
export class UpdateCardStatToMySql extends UpdateValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool,
  ) { super(db); };

  private async updateTable({
    db, tableName, uniqueValue, updateColName, updateValue
  } : {
    db : Pool, tableName : string, uniqueValue: string; updateColName: string; updateValue: number
  }) : Promise<boolean> {

    // 상한선도 막을 수 있다는 점이다. 
    const sql : string = `
    UPDATE \`${tableName}\`
    SET 
      \`${updateColName}\` = GREATEST(\`${updateColName}\` + ?, 0)
    WHERE 
      \`${DB_CARD_STATS_ATTRIBUTE_NAME.CARD_ID}\` = UUID_TO_BIN(?, true)
    `;

    const [ res ] = await db.query<ResultSetHeader>(sql, [ updateValue, uniqueValue ]);

    return res && res.affectedRows ? true : false;
  }

  // updateColname을 변환 시킬것이고 updateValue는 얼마만큼 변환시키는지 숫자를 나타내도록 함 updateValue -> 1 이면 1 올림
  // uniqueValue는 card_id 이다.
  async update({ uniqueValue, updateColName, updateValue }: { uniqueValue: string; updateColName: string; updateValue: number; }): Promise<boolean> {
   
    const db = this.db;
    const tableName : string = DB_TABLE_NAME.CARD_STATS;  

    const updated : boolean = await this.updateTable({ db, tableName, uniqueValue, updateColName, updateValue });

    return updated;
  };

}

// card_item의 정보를 수정하는 로직
@Injectable()
export class UpdateCardItemsToMysql extends UpdateValuesToDb<Pool> {

  // 수정 가능한 col이름
  private readonly updateColName = [
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "scale_x",
    "scale_y",
    "opacity",
    "z_index",
    "is_locked",
    "is_visible",
    "name",
    "option",
  ] as const;

  constructor(
    @Inject(MYSQL_DB) db : Pool,
  ) { super(db); };

  // 변경된 숫자 
  private async updateOne({
    connection, tableName, entity
  } : {
    connection : PoolConnection, tableName : string, entity : UpdateCardItemDto
  }) : Promise<number> {

    const { item_id } = entity;

    const cols : Array<string> = [];
    const values : Array<any> = [];

    // col 확인
    for ( const col of this.updateColName ) {
      // 수정 열에 없다면 스킵
      if ( !(col in entity) ) continue;

      // undefiend는 mysql에 넣을 수 없다 따라서 null만 가능하게 하기 위해서
      const v = entity[col];
      if ( v === undefined ) continue;

      cols.push(`\`${col}\` = ?`); 

      if ( col === "option" ) {
        // JSON 타입에 mysql 8.0 이라면 그냥 넣어도 큰 문제는 없지만 혹시 모를 x : () => {} 이런거 같은 경우 에러를 일으키기 때문에 안전하다. 
        values.push(v === null ? null : JSON.stringify(v)); // option 때문에 일단 이런식으로 수정 
        continue;
      }
      values.push(v);
    }

    if ( cols.length === 0 ) return 0;
    
    const sql : string = `
    UPDATE \`${tableName}\`
    SET ${ cols.join(",") }
    WHERE \`${DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID}\` = UUID_TO_BIN(?, true)
    `.trim();
    values.push(item_id);

    const [ res ] = await connection.execute<ResultSetHeader>(sql, values);

    return res.affectedRows;
  }

  // 정합성을 높이자
  private async updateData({
    db, tableName, entities
  } : {
    db : Pool, tableName : string, entities: Array<UpdateCardItemDto>
  }) : Promise<boolean> {

    const connection = await db.getConnection();
    try {

      await connection.beginTransaction();

      // 마지막 값이 수정 값으로 설정하도록 수정 -> guard로서 넣는게 맞을까? 
      const entitesNotDup = new Map<string, UpdateCardItemDto>();
      for ( const e of entities ) entitesNotDup.set(e.item_id, e);
      // 마지막만 남은 data들
      const datas = [...entitesNotDup.values()];

      // 수정할 데이터 선정
      for ( const data of datas ) {
        if ( !data.item_id ) continue; // 만약 해당 item_id가 없다면 graphql에서 잡히기는 했을거다 여기서는 그냥 스킵으로 가자
        await this.updateOne({ connection, tableName, entity : data });
      }

      await connection.commit();
      return true;
    } catch (err) {
      if ( connection ) await connection.rollback();
      throw new DatabaseError(err);
    } finally {
      if (connection) connection.release();
    }

  }

  async updates(entities: Array<UpdateCardItemDto>): Promise<boolean> {

    const db : Pool = this.db;
    const tableName : string = DB_TABLE_NAME.CARD_ITEMS;

    const updated : boolean = await this.updateData({ db, tableName, entities });
    return updated;
  }

};

// 그냥 삭제하는게 아니라 soft update로 삭제할 예정
@Injectable()
export class DeleteCardItemsToMySql extends DeleteValuesToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool,
  ) { super(db); };


  private async deleteDatas({
    db, keys
  } : { 
    db : Pool, keys : Array<{ uniqueValue: string; addOption: undefined; }>
  }) : Promise<boolean> {

    const connect = await db.getConnection();

    try {

      await connect.beginTransaction();

      const item_ids_set = new Set<string>(); 
      keys.forEach(key => {
        const item_id : string = key.uniqueValue;
        item_ids_set.add(item_id);
      });

      // 만약 값이 하나도 없다면 스킵
      const item_ids : Array<string> = [...item_ids_set.values()];
      if ( item_ids.length === 0 ) {
        await connect.commit();
        return true;
      }

      const cardItemTableName : string = DB_TABLE_NAME.CARD_ITEMS;
      const playholders : string = item_ids.map(() => `UUID_TO_BIN(?, true)`).join(",");

      const sql : string = `
      UPDATE \`${cardItemTableName}\`
      SET 
        \`${DB_CARD_ITEMS_ATTRIBUTE_NAME.DELETED_AT}\` = NOW(6)
      WHERE \`${DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID}\` IN (${playholders})
      `;
      const [res] = await connect.execute<ResultSetHeader>(sql,  item_ids);

      await connect.commit();

      return res && res.affectedRows ? true : false;
    } catch (err) {
      if ( connect ) await connect.rollback();
      throw new DatabaseError(err);
    } finally {
      if ( connect ) connect.release();
    };
  }

  // 여기서 uniqueValue는 item_id 이다.
  async deletes(keys: Array<{ uniqueValue: string; addOption: undefined; }>): Promise<boolean> {
    
    const db : Pool = this.db;
    const deleted : boolean = await this.deleteDatas({ db, keys }); 
    return deleted;
  };

};

// card를 업데이트 할 때 사용하는 infra 함수
@Injectable()
export class UpdateCardToMysql extends UpdateValueToDb<Pool> {

  // 이 열에 해당하는 것만 수정
  private readonly updateColName = {
    [ DB_CARDS_ATTRIBUTE_NAME.CATEGORY_ID ] : true,
    [ DB_CARDS_ATTRIBUTE_NAME.THUMBNAIL_PATH ] : true,
    [ DB_CARDS_ATTRIBUTE_NAME.TITLE ] : true,
    [ DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_WIDTH ] : true,
    [ DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_HEIGHT ] : true,
    [ DB_CARDS_ATTRIBUTE_NAME.BACKGROUND_COLOR ] : true
  } as const;

  constructor(
    @Inject(MYSQL_DB) db : Pool,
  ) { super(db); };

  private async updateData({
    db, tableName, uniqueValue, updateValue
  } : {
    db : Pool, tableName : string, uniqueValue : string, updateValue : UpdateCardInputDto
  }) : Promise<boolean> {

    const { card_id, ...etc } = updateValue; // card_id 제외 

    const vals : Array<string | number | null> = [];
    const cols : Array<string> = [];

    for ( const [ k, v ] of Object.entries(etc) ) {
      if ( ( k in this.updateColName ) && v !== undefined ) {
        cols.push(`\`${k}\` = ?`);
        vals.push(v);
      };
    };

    // 수정할 값이 없는 걸로 판별
    if ( cols.length === 0 ) return true;

    const placeholders : string = cols.join(", ");
    vals.push(uniqueValue);
    
    // pk 인데 limit를 넣는게 의미가 있을까?
    const sql : string = `
    UPDATE \`${tableName}\`
    SET ${placeholders}
    WHERE \`${DB_CARDS_ATTRIBUTE_NAME.CARD_ID}\` = UUID_TO_BIN(?, true)
    `;

    const [ result ] = await db.execute<ResultSetHeader>(sql, vals);

    return result && result.affectedRows ? true : false;
  }

  // 여기서는 uniqueValue는 card_id가 되고 updateValue는 dto가 된다. 
  async update({ uniqueValue, updateColName, updateValue }: { uniqueValue: string; updateColName: string; updateValue: UpdateCardInputDto; }): Promise<boolean> {
    
    const db : Pool = this.db;
    const tableName : string = DB_TABLE_NAME.CARDS;

    const updated : boolean = await this.updateData({ db, tableName, uniqueValue, updateValue });

    return updated;
  }

};
