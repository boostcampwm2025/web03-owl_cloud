import { NotAllowCardItemIamgeMimeType, NotAllowCardItemIamgeStatusValue } from "@error/domain/card/card.error";
import { baseVo } from "@domain/shared";
import { NotAllowMinValue } from "@/0.common/error/domain/user/user.error";


export const cardItemImageStatusList = ['uploading', 'ready', 'failed'] as const;
export type CardItemImageStatusProps = typeof cardItemImageStatusList[number];

export type CardItemImageProps = {
  item_id : string;
  src : string;
  mime_type : string;
  size : number;
  status : CardItemImageStatusProps;
  natural_width : number;
  natural_height : number;
  corner_radius : number | undefined;
  stroke : string | undefined;
  stroke_width : number | undefined;
  filter : string | undefined;
  created_at? : Date;
  updated_at? : Date;
};

// card_image에 대한 타입 정리
const cardItemImageMimeTypeList : Array<string> = [
  'image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'
];
export function cardItemImageMimeTypeVo( mime_type : CardItemImageProps["mime_type"] ) : string {
  const name : string = "mime_type";

  baseVo({ name, value : mime_type, type : "string" });
  mime_type = mime_type.trim();

  if ( !cardItemImageMimeTypeList.includes(mime_type) ) throw new NotAllowCardItemIamgeMimeType();

  return mime_type;
};

// size에 대한 타입 정리
export function cardItemImageSizeVo( size : CardItemImageProps["size"] ) : number {
  const name : string = "size";

  if ( size !== 0 ) baseVo({ name, value : size, type : "number" });

  const min : number  = 0;
  if ( size < min ) throw new NotAllowMinValue({ name, min });

  return size;
};

// status에 대한 정리
export function cardItemImageStatusVo( status : CardItemImageProps["status"] ) : CardItemImageStatusProps {
  const name : string = "status";

  baseVo({ name, value : status, type : "string" });
  status = (status.trim() as any);

  if ( !cardItemImageStatusList.includes(status) ) throw new NotAllowCardItemIamgeStatusValue();

  return status;
};

// natural_width, natural_height 에 대한 정리
export function cardItemImageNaturalValueVo( name : string, natural_value : CardItemImageProps["natural_width"] | CardItemImageProps["natural_height"] ) : number {

  if ( natural_value !== 0 ) baseVo({ name, value : natural_value, type : "number" });

  const min : number = 0;
  if ( natural_value <= min ) throw new NotAllowMinValue({ name, min });

  return natural_value;
};

// corner_radius에 대한 정리
export function cardItemImageCornerRadiusVo( corner_radius : Exclude<CardItemImageProps["corner_radius"], undefined> ) : number {
  const name : string = "corner_radius";

  if ( corner_radius !== 0 ) baseVo({ name, value : corner_radius, type : "number" });

  const min : number = 0;
  if ( corner_radius <= min ) throw new NotAllowMinValue({ name, min });

  return corner_radius;
};

// stroke에 대한 정리
const strokeRegxp : Array<RegExp> = [
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0(\.\d+)?|1(\.0+)?)\s*\)$/
];
export function cardItemImageStrokeVo( stroke : Exclude<CardItemImageProps["stroke"], undefined> ) : string {
  const name : string = "stroke";

  baseVo({ name, value : stroke, type : "string" });
  stroke = stroke.trim();

  let strokeChecked : boolean = false;
  for ( const reg of strokeRegxp ) {
    if ( reg.test(stroke) ) {
      strokeChecked = true;
      break;
    };
  };

  return stroke;
};

// stroke_width에 대한 정리
export function cardItemImageStrokeWidthVo( stroke_width : Exclude<CardItemImageProps["stroke_width"], undefined> ) : number {
  const name : string = "stroke_width";

  if ( stroke_width !== 0 ) baseVo({ name, value : stroke_width, type : "number" });

  const min : number = 0;
  if ( stroke_width <= min ) throw new NotAllowMinValue({ name, min });

  return stroke_width;
};

// filter에 대한 정리
export function cardItemImageFilterVo(  ) {

};