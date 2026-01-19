import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomValidate {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(100) // 몇명 제한?
  max_participants: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(16)
  password?: string;
}
