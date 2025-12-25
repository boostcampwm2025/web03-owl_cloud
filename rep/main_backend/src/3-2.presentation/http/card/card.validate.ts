import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsInt, IsJSON, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested } from "class-validator";


export class CreateCardValidate {

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  category_id : number;
  
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title : string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  workspace_width : number;
  
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  workspace_height : number;
  
  @IsString()
  @IsNotEmpty()
  @Matches(
  /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0(\.\d+)?|1(\.0+)?)\s*\))$/)
  background_color : string;
};


class CreateCardItemInfoValidate { 
  
  @IsNotEmpty()
  @IsString()
  @MaxLength(1500)
  path : string;

  @IsNotEmpty()
  @IsIn([ 'image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg' ])
  mime_type : 'image/apng' | 'image/avif' | 'image/gif' | 'image/jpeg' | 'image/png' | 'image/svg+xml' | 'image/webp' | 'video/mp4' | 'video/webm' | 'video/ogg';
  
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100 * 1024 * 1024) // 100mb까지 허용
  size : number;
}

// card에 item을 생성하기 위해서 필요한 정보들 
export class CreateCardItemValidate {

  @IsNotEmpty()
  @IsIn([ 'text', 'image', 'video' ])
  type : 'text' | 'image' | 'video';

  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  x : number;

  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  y : number; 

  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  width : number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  height? : number; // default 없음 

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  rotation? : number; // 없으면 default 0 

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  scale_x? : number; // 없으면 defualt 1.000

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  scale_y? : number;  // 없으면 defualt 1.000

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  opacity? : number; // default 없음 

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  z_index? : number; // default 없음 

  @IsOptional()
  @IsBoolean()
  is_locked? : boolean; // default 없음 

  @IsOptional()
  @IsBoolean()
  is_visible? : boolean; // default 없음 

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name? : string; // default 없음 

  // 추가 적인 정보 - 여기서 값을 강제하는 방법도 존재할 것이고 아니면 vo에서 처리하는 방법도 있을 것이다. 
  @IsNotEmpty()
  @IsObject()
  option : Record<string, any>;

  @ValidateIf(o => o.type === "image" || o.type === "image") // 현재 객체를 기준으로 값을 정한다 -> text가 아닌경우에는 필수로 있어야 함
  @IsNotEmpty()
  @ValidateNested() // 중첩된 객체를 검증하라는 데코레이터 이다. 
  @Type(() => CreateCardItemInfoValidate)
  file_info? : CreateCardItemInfoValidate

};

export class GetPresignedUrlsValidate {

  @IsNotEmpty()
  @IsString()
  upload_id : string;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each : true })
  @Min(1, { each : true })
  @Max(10000, { each : true })
  part_numbers : Array<number>

};