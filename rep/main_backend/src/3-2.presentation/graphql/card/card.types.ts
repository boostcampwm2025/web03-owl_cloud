// 조심해야 할 건 domain과 비슷한 이름이라는 점이다. 이에 대해서 고민을 해봐야 한다. 
import { Field, Float, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";


// card_item_asset에 대한 정보
export enum CardItemAssetStatusType {
  UPLOADING = 'uploading',
  READY = 'ready',
  FAILED = 'failed'
};

registerEnumType(CardItemAssetStatusType, {
  name : "CardItemAssetStatusType"
});

@ObjectType()
export class CardItemAsset {

  @Field(() => ID)
  item_id : string;

  @Field(() => String)
  path : string;

  @Field(() => CardItemAssetStatusType)
  status : CardItemAssetStatusType;

};

// card_item에 대한 정보
// typescript에 enum 값으로 남긴다. ( 런타임 중에도 살음 )
export enum CardItemType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video"
};

// graphql에 해당 enum을 스키마로 변경
registerEnumType(CardItemType, {
  name : "CardItemType"
});

@ObjectType()
export class CardItem {

  @Field(() => ID)
  item_id : string;

  @Field(() => CardItemType)
  type : CardItemType;

  @Field(() => Int)
  x : number;

  @Field(() => Int)
  y : number;

  @Field(() => Int)
  width : number;

  @Field(() => Int, { nullable : true })
  height? : number | null;

  @Field(() => Int)
  rotation : number;
  
  @Field(() => Float)
  scale_x : number;
 
  @Field(() => Float)
  scale_y : number;

  @Field(() => Float, { nullable : true })
  opacity? : number | null;

  @Field(() => Int, { nullable : true })
  z_index? : number | null;

  @Field(() => Boolean, { nullable : true })
  is_locked? : boolean | null;

  @Field(() => Boolean, { nullable : true })
  is_visible? : boolean | null;

  @Field(() => String , { nullable : true })
  name? : string | null;

  @Field(() => GraphQLJSON) // json 형태로 아무거나 받을 수 있다 라는 의미이다.  
  option: Record<string, any>;

  @Field(() => CardItemAsset, { nullable : true })
  card_asset? : CardItemAsset | null; // text이면 null을 줄 예정이다. 

};

// 해당 card에 대해서 추가를 해준다. 
@ObjectType()
export class Card {

  @Field(() => ID)
  card_id : string;

  @Field(() => Int)
  category_id : number;

  @Field(() => String, { nullable : true })
  thumbnail_path  : string | null;

  @Field(() => String)
  title : string;

  @Field(() => Int)
  workspace_width : number;

  @Field(() => Int)
  workspace_height : number;

  @Field(() => String)
  background_color : string;

  @Field(() => [CardItem])
  card_items : CardItem[];

};