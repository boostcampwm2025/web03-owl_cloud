import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { Inject, Injectable } from "@nestjs/common";
import { RowDataPacket, type Pool } from "mysql2/promise";
import { DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME, DB_CARD_ITEMS_ATTRIBUTE_NAME, DB_CARD_STATS_ATTRIBUTE_NAME, DB_CARDS_ATTRIBUTE_NAME, DB_TABLE_NAME, MYSQL_DB } from "../../db.constants";
import { CardItemAssetProps, CardItemAssetStatusProps, CardItemProps } from "@domain/card/vo";
import { GetCardItemAndAssetListsType, GetCardMetaAndStatProps } from "@app/card/queries/usecase";


interface CardItemAssetRowPacket extends RowDataPacket {
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CARD_ID ] : string;
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID ] : string;
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.KEY_NAME ] : string;
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.MIME_TYPE ] : string;
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS ] : CardItemAssetStatusProps;
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.SIZE ] : number;
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CREATED_AT ] : Date;
  [ DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.UPDATED_AT ] : Date;
};

@Injectable()
export class SelectCardItemAssetFromMysql extends SelectDataFromDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool,
  ) { super(db); };

  private async selectData({
    db, tableName, attributeName, attributeValue
  } : {
    db : Pool; tableName : string; attributeName: string; attributeValue: string;
  }) : Promise<CardItemAssetRowPacket | undefined> {

    const sql : string = `
    SELECT 
    BIN_TO_UUID(\`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CARD_ID}\`, true) AS ${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CARD_ID},
    BIN_TO_UUID(\`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID}\`, true) AS ${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID},
    \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.KEY_NAME}\`,
    \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.MIME_TYPE}\`,
    \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS}\`,
    \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.SIZE}\`,
    \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CREATED_AT}\`,
    \`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.UPDATED_AT}\`
    FROM \`${tableName}\`
    WHERE \`${attributeName}\` = UUID_TO_BIN(?, true)
    LIMIT 1
    `;

    const [ cardItemAsset ] = await db.query<Array<CardItemAssetRowPacket>>(sql, [ attributeValue ]);

    return cardItemAsset && cardItemAsset[0]
  }

  async select({ attributeName, attributeValue }: { attributeName: string; attributeValue: string; }): Promise<Required<CardItemAssetProps> | undefined> {
    
    const db : Pool = this.db;
    const tableName : string = DB_TABLE_NAME.CARD_ITEM_ASSETS;

    const cardItemAsset = await this.selectData({ db, tableName, attributeName, attributeValue });

    if ( !cardItemAsset ) return undefined;

    return {
      card_id : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CARD_ID],
      item_id : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID],
      key_name : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.KEY_NAME],
      mime_type : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.MIME_TYPE],
      status : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS],
      size : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.SIZE],
      created_at : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CREATED_AT],
      updated_at : cardItemAsset[DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.UPDATED_AT]
    };
  };

};

// 해당 card_id에 해당하는 모든 card_item, card_asset을 가져온다. 
@Injectable()
export class SelectAllCardItemAndAssetFromMysql extends SelectDataFromDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  // 여기서 attributeName은 card_id와 해당하는 열 이름 attributeValue은 card_id에 해당하는 값
  private async selectData({
    db, attributeName, attributeValue
  } : {
    db : Pool, attributeName : string, attributeValue : string
  }) : Promise<Array<GetCardItemAndAssetListsType> | undefined> {

    // card_item과 관련된 테이블
    const cardItemTableName : string = DB_TABLE_NAME.CARD_ITEMS;
    const cardItemNamespace : string = "ci";

    // card_asset과 관련된 테이블
    const cardItemAssetTableName : string = DB_TABLE_NAME.CARD_ITEM_ASSETS;
    const cardItemAssetNamespace : string = "cia";
    
    // 문제는 item_id인데... 
    const ciCols = [
      DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.TYPE,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.X,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.Y,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.WIDTH,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.HEIGHT,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.ROTATION,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_X,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_Y,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.OPACITY,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.Z_INDEX,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_LOCKED,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_VISIBLE,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.NAME,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.OPTION
    ] as const;

    const ciaCols = [
      DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID,
      DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.KEY_NAME,
      DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.MIME_TYPE,
      DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.SIZE,
      DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS,
      DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CARD_ID
    ] as const;

    // 여기서 만약 해당 값에 달하면 그건 예외처리하는 방식으로 변경하려고 한다.
    const uuidCols = new Set<string>(["item_id", "card_id"]);
    const isUuidCol = (c: string): c is "item_id" | "card_id" => uuidCols.has(c); 

    // 전체 카드 열이름으로 바꾸기
    const selectClause : string = [
      ...ciCols.map((c) => {
        if ( isUuidCol(c) ) return `BIN_TO_UUID(${cardItemNamespace}.\`${c}\`, true) AS \`ci__${c}\``
        else return `${cardItemNamespace}.\`${c}\` AS \`ci__${c}\``
      }),
      ...ciaCols.map((c) => {
        if ( isUuidCol(c) ) return `BIN_TO_UUID(${cardItemAssetNamespace}.\`${c}\`, true) AS \`cia__${c}\``
        else return `${cardItemAssetNamespace}.\`${c}\` AS \`cia__${c}\``;
      }),
    ].join(",\n    ");

    // 명확한건 해당 attribute_name이 맞는지 확인해주어야 한다.
    if (attributeName.trim() !== DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID ) {
      throw new Error("카드 ID열을 다시 확인해주세요");
    }

    // card_item은 다 가져오고 card_item_assets은 없을 수도 있다.
    const sql : string = `
    SELECT 
    ${selectClause}
    FROM \`${cardItemTableName}\` ${cardItemNamespace} 
    LEFT JOIN \`${cardItemAssetTableName}\` ${cardItemAssetNamespace} ON
    ${cardItemNamespace}.\`${DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID}\` = ${cardItemAssetNamespace}.\`${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID}\`
    WHERE ${cardItemNamespace}.\`${attributeName}\` = UUID_TO_BIN(?, true) AND ${cardItemNamespace}.\`${DB_CARD_ITEMS_ATTRIBUTE_NAME.DELETED_AT}\` IS NULL
    `;

    const [ rows ] = await db.query<Array<any>>(sql, [attributeValue]);

    return rows.map((r) => {
      // 잘못된 option은 잡아낸다. 
      let optionObj: Record<string, any> = {};
      const raw = r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.OPTION}`];
      if (typeof raw === "string") {
        try { optionObj = JSON.parse(raw); } catch { optionObj = {}; }
      } else {
        optionObj = raw ?? {};
      }

      // card_item은 필수로 주어야 하고 
      const card_items: CardItemProps = {
        item_id: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID}`],
        card_id: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID}`],
        type: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.TYPE}`],
        x: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.X}`],
        y: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.Y}`],
        width: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.WIDTH}`],
        height: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.HEIGHT}`] ?? undefined,
        rotation: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.ROTATION}`],
        scale_x: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_X}`],
        scale_y: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_Y}`],
        opacity: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.OPACITY}`] ?? undefined,
        z_index: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.Z_INDEX}`] ?? undefined,
        is_locked: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_LOCKED}`] ?? undefined,
        is_visible: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_VISIBLE}`] ?? undefined,
        name: r[`ci__${DB_CARD_ITEMS_ATTRIBUTE_NAME.NAME}`] ?? undefined,
        option: optionObj,
      };

      const card_assets : CardItemAssetProps | undefined = r[`cia__${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID}`] ? 
      { 
        item_id : r[`cia__${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.ITEM_ID}`],
        key_name: r[`cia__${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.KEY_NAME}`],
        mime_type: r[`cia__${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.MIME_TYPE}`],
        size: r[`cia__${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.SIZE}`],
        status: r[`cia__${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.STATUS}`],
        card_id: r[`cia__${DB_CARD_ITEM_ASSETS_ATTRIBUTE_NAME.CARD_ID}`]
      } : undefined;

      return { card_items, card_assets };
    });
  }

  // 해당 card_id에 해당하는 값을 찾으면 된다.
  async select({ attributeName, attributeValue, }: { attributeName: string; attributeValue: any; }): Promise<Array<GetCardItemAndAssetListsType> | undefined> {
    
    const db = this.db;

    const datas : Array<GetCardItemAndAssetListsType> | undefined = await this.selectData({ db, attributeName, attributeValue });

    return datas;
  }

};


interface CardMetaAndStatRow extends RowDataPacket {
  card_id: string;
  user_id: string;
  category_id: number;
  thumbnail_path: string | null;
  status: "published" | "draft" | "archived";         
  title: string;
  workspace_width: number;
  workspace_height: number;
  background_color: string;
  view_count: number;
  like_count: number;
}
@Injectable()
export class SelectCardAndStatFromMysql extends SelectDataFromDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  private async selectData({
    db, attributeName, attributeValue
  } : {
    db : Pool, attributeName : string, attributeValue : string
  }) : Promise<GetCardMetaAndStatProps | undefined> {

    const cardTableName : string = DB_TABLE_NAME.CARDS;
    const cardNamespace : string = "c";

    const cardStatTableName : string = DB_TABLE_NAME.CARD_STATS;
    const cardStatNamespace : string = "cs";

    const sql : string = `
    SELECT 
    BIN_TO_UUID(${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.CARD_ID}\`, true) AS ${DB_CARDS_ATTRIBUTE_NAME.CARD_ID},
    BIN_TO_UUID(${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.USER_ID}\`, true) AS ${DB_CARDS_ATTRIBUTE_NAME.USER_ID},
    ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.CATEGORY_ID}\`,
    ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.THUMBNAIL_PATH}\`,
    ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.STATUS}\`,
    ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.TITLE}\`,
    ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_WIDTH}\`,
    ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_HEIGHT}\`,
    ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.BACKGROUND_COLOR}\`,
    ${cardStatNamespace}.\`${DB_CARD_STATS_ATTRIBUTE_NAME.VIEW_COUNT}\`,
    ${cardStatNamespace}.\`${DB_CARD_STATS_ATTRIBUTE_NAME.LIKE_COUNT}\`
    FROM \`${cardTableName}\` ${cardNamespace} INNER JOIN \`${cardStatTableName}\` ${cardStatNamespace}
    ON ${cardNamespace}.\`${DB_CARDS_ATTRIBUTE_NAME.CARD_ID}\` = ${cardStatNamespace}.\`${DB_CARD_STATS_ATTRIBUTE_NAME.CARD_ID}\`
    WHERE ${cardNamespace}.\`${attributeName}\` = UUID_TO_BIN(?, true)
    LIMIT 1
    `; 

    const [ rows ] = await db.query<CardMetaAndStatRow[]>(sql, [attributeValue]);

    if ( !rows || rows.length === 0 ) return undefined;
    const row : CardMetaAndStatRow = rows[0]
    return {
      card : {
        card_id: row.card_id,
        user_id: row.user_id,
        category_id: row.category_id,
        thumbnail_path: row.thumbnail_path ?? undefined,
        status: row.status,
        title: row.title,
        workspace_width: row.workspace_width,
        workspace_height: row.workspace_height,
        background_color: row.background_color,
      },
      card_stat : {
        id : 1,
        card_id: row.card_id,
        view_count: row.view_count,
        like_count: row.like_count,
      }
    }
  }

  // 여기서는 card_id가 사용된다. 
  async select({ attributeName, attributeValue, }: { attributeName: string; attributeValue: any; }): Promise<GetCardMetaAndStatProps | undefined> {
    
    const db : Pool = this.db;

    const data = await this.selectData({ db, attributeName, attributeValue });

    return data;
  };

};