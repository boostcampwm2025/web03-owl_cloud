import { Injectable } from '@nestjs/common';
import { type CreateUserOauthDto } from '@app/auth/commands/dto';
import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { InsertValueToDb } from '@app/ports/db/db.outbound';
import { OauthUserProps, UserProps } from '@domain/user/user.vo';
import { InValidEmailError, NotInvalidOauthUserError } from '@error/application/user/user.error';
import { UserAggregate } from '@domain/user/user.aggregate';
import { IdGenerator } from '@domain/shared';

// 변수로 사용되는 거
export type SignUpOauthUsecaseValueProps = {
  emailAttributeName: string;
};

// usecase에서 사용되는 props
type SignUpOauthUsecaseProps<T> = {
  usecaseValues: SignUpOauthUsecaseValueProps; // usecase에서 사용되는 변수 모음
  selectDataWhereEmailFromDb: SelectDataFromDb<T>; // 데이터를 찾기 위한 port
  userIdGenerator: IdGenerator; // user_id를 만드는
  insertUserAndOauthDataToDb: InsertValueToDb<T>; // 데이터를 insert 하기 위한 port
};

// INSERT 할때 사용하는 데이터
export type InsertOauthUserDataProps = {
  userData: UserProps;
  oauthData: OauthUserProps;
};

@Injectable()
export class SignUpOauthUsecase<T> {
  private readonly usecaseValues: SignUpOauthUsecaseProps<T>['usecaseValues'];
  private readonly selectDataWhereEmailFromDb: SignUpOauthUsecaseProps<T>['selectDataWhereEmailFromDb'];
  private readonly userIdGenerator: SignUpOauthUsecaseProps<T>['userIdGenerator'];
  private readonly insertUserAndOauthDataToDb: SignUpOauthUsecaseProps<T>['insertUserAndOauthDataToDb'];

  constructor({
    usecaseValues,
    selectDataWhereEmailFromDb,
    userIdGenerator,
    insertUserAndOauthDataToDb,
  }: SignUpOauthUsecaseProps<T>) {
    this.usecaseValues = usecaseValues;
    this.selectDataWhereEmailFromDb = selectDataWhereEmailFromDb;
    this.userIdGenerator = userIdGenerator;
    this.insertUserAndOauthDataToDb = insertUserAndOauthDataToDb;
  }

  // 회원가입 할때 사용되는 dto
  public async execute(dto: CreateUserOauthDto): Promise<boolean> {
    // 굳이 mapper를 사용할 필요가 있을까? 여기서는 생략

    // 1. email 중복 확인
    const user: UserProps | undefined = await this.selectDataWhereEmailFromDb.select({
      attributeName: this.usecaseValues.emailAttributeName,
      attributeValue: dto.email,
    });
    if (user) throw new InValidEmailError();

    // 2. user 객체 생성 - 정합성 파악
    const userAggregate = UserAggregate.create({
      input: {
        email: dto.email,
        nickname: dto.nickname,
        password_hash: undefined,
      },
      userIdGenerator: this.userIdGenerator,
    });
    const userData: UserProps = userAggregate.getUserData();

    // 3. oauth용 객체 생성 - 정합성 파악
    const oauthData: OauthUserProps | undefined = userAggregate
      .connectOauth({
        provider: dto.provider,
        provider_id: dto.provider_id,
        created_at: userData.created_at || new Date(),
        updated_at: userData.updated_at || new Date(),
      })
      .getOauthUserData();
    if (!oauthData) throw new NotInvalidOauthUserError();

    // 4. 유저 + oauth 정보 저장
    const insertData: InsertOauthUserDataProps = {
      userData,
      oauthData,
    };
    const insertChecked: boolean = await this.insertUserAndOauthDataToDb.insert(insertData);

    return insertChecked;
  }
}
