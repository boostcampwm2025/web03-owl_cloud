import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignUpValidate {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  nickname: string;

  // 영문1, 특수문자1, 숫자1이 있어야 가입이 되고 6 ~ 16 글자 사이
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(16)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
  password: string;
}

export class LoginValidate {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  // 영문1, 특수문자1, 숫자1이 있어야 가입이 되고 6 ~ 16 글자 사이
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(16)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
  password: string;
}
