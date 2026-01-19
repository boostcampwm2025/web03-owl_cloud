// 회원 가입 관련 유스 케이스 - 로컬을 이용
import { IdGenerator } from '@domain/shared';
import { MakeHashPort } from '@app/ports/share';
import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { InsertValueToDb } from '@app/ports/db/db.outbound';
import { CreateUserNormalDto } from '../dto';
import { UserProps } from '@domain/user/user.vo';
import { InValidEmailError, NotMakeHashValue } from '@error/application/user/user.error';
import { UserAggregate } from '@domain/user/user.aggregate';

type SignUpUsecaseValuesProps = {
  emailAttributeName: string;
};

type SignUpUsecaseProps<T> = {
  usecaseValues: SignUpUsecaseValuesProps;
  selectDataWhereEmailFromDb: SelectDataFromDb<T>; // 유저의 이메일 중복성을 확인하기 위한 객체
  insertUserDataToDb: InsertValueToDb<T>; // 유저 정보를 기입하기 위한 객체
  userIdGenerator: IdGenerator; // user_id 만드는 객체
  makeHash: MakeHashPort; // hash를 만드는 객체
};

export class SignUpUsecase<T> {
  private readonly usecaseValues: SignUpUsecaseProps<T>['usecaseValues'];
  private readonly selectDataWhereEmailFromDb: SignUpUsecaseProps<T>['selectDataWhereEmailFromDb'];
  private readonly insertUserDataToDb: SignUpUsecaseProps<T>['insertUserDataToDb'];
  private readonly userIdGenerator: SignUpUsecaseProps<T>['userIdGenerator'];
  private readonly makeHash: SignUpUsecaseProps<T>['makeHash'];

  constructor({
    usecaseValues,
    selectDataWhereEmailFromDb,
    insertUserDataToDb,
    userIdGenerator,
    makeHash,
  }: SignUpUsecaseProps<T>) {
    this.usecaseValues = usecaseValues;
    this.selectDataWhereEmailFromDb = selectDataWhereEmailFromDb;
    this.insertUserDataToDb = insertUserDataToDb;
    this.userIdGenerator = userIdGenerator;
    this.makeHash = makeHash;
  }

  // email, nickname, password dto 제공
  public async execute(dto: CreateUserNormalDto): Promise<boolean> {
    // 1. 이메일 중복 확인
    const userEntity: UserProps | undefined = await this.selectDataWhereEmailFromDb.select({
      attributeName: this.usecaseValues.emailAttributeName,
      attributeValue: dto.email,
    });
    if (userEntity) throw new InValidEmailError();

    // 2. 비밀번호 해쉬화
    const password_hash: string = await this.makeHash.makeHash(dto.password);

    // 3. 데이터 정합성 파악
    if (password_hash) {
      const userAggregate = UserAggregate.create({
        input: {
          email: dto.email,
          nickname: dto.nickname,
          password_hash,
        },
        userIdGenerator: this.userIdGenerator,
      });
      const newUserData: UserProps = userAggregate.getUserData();

      // 4. 유저 정보 저장
      const insertChecked: boolean = await this.insertUserDataToDb.insert(newUserData);

      return insertChecked;
    } else throw new NotMakeHashValue(); // 해시 생성 안됨
  }
}
