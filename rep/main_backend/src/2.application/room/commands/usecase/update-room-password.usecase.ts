import { UpdateDataToCache } from '@app/ports/cache/cache.outbound';
import { UpdateValueToDb } from '@app/ports/db/db.outbound';
import { Injectable } from '@nestjs/common';
import { UpdateRoomInfoResult, UpdateRoomPasswordDto } from '../dto';
import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { NotAllowUpdatePassword, NotChangePassword } from '@error/application/room/room.error';
import { MakeHashPort } from '@app/ports/share';

// 방에 비밀번호를 변경하는 usecase
type UpdateRoomPasswordUsecaseProps<T, CT> = {
  selectUserInfoInRoomFromDb: SelectDataFromDb<T>; // 유저가 호스트가 맞는지 확인하는 로직 ( 현재 방이 존재하고 호스트가 맞는지 )
  hashPassword: MakeHashPort; // 비밀번호 해쉬화
  updateRoomPasswordToDb: UpdateValueToDb<T>; // db에 방 비밀번호를 변경한다.
  updateRoomPasswordToCache: UpdateDataToCache<CT>; // cache에 방 비밀번호를 변경한다.
};

@Injectable()
export class UdpateRoomPasswordUsecase<T, CT> {
  private readonly selectUserInfoInRoomFromDb: UpdateRoomPasswordUsecaseProps<
    T,
    CT
  >['selectUserInfoInRoomFromDb'];
  private readonly hashPassword: UpdateRoomPasswordUsecaseProps<T, CT>['hashPassword'];
  private readonly updateRoomPasswordToDb: UpdateRoomPasswordUsecaseProps<
    T,
    CT
  >['updateRoomPasswordToDb'];
  private readonly updateRoomPasswordToCache: UpdateRoomPasswordUsecaseProps<
    T,
    CT
  >['updateRoomPasswordToCache'];

  constructor({
    selectUserInfoInRoomFromDb,
    hashPassword,
    updateRoomPasswordToDb,
    updateRoomPasswordToCache,
  }: UpdateRoomPasswordUsecaseProps<T, CT>) {
    this.selectUserInfoInRoomFromDb = selectUserInfoInRoomFromDb;
    this.hashPassword = hashPassword;
    this.updateRoomPasswordToDb = updateRoomPasswordToDb;
    this.updateRoomPasswordToCache = updateRoomPasswordToCache;
  }

  async execute(dto: UpdateRoomPasswordDto): Promise<void> {
    // 1. 현재 방에 위치해 있고 호스트가 맞는지 확인 ( 비밀번호 확인이 필요하다면 아래에 추가 설정이 필요하다. )
    const roomInfo: UpdateRoomInfoResult | undefined = await this.selectUserInfoInRoomFromDb.select(
      { attributeName: dto.code, attributeValue: dto.user_id },
    ); // 열의 이름을 여기서는 코드로 사용할 예정이고 user_id에 경우는 인덱스로 사용할 예정
    if (!roomInfo) throw new NotAllowUpdatePassword();

    // 2. 비밀번호를 해쉬화 한다.
    let password_hash: string | null = null;
    if (dto.new_password) password_hash = await this.hashPassword.makeHash(dto.new_password);

    // 3. 비밀번호를 db에 저장한다.
    const inserted: boolean = await this.updateRoomPasswordToDb.update({
      uniqueValue: roomInfo.room_id,
      updateColName: dto.user_id,
      updateValue: password_hash,
    });
    if (!inserted) throw new NotChangePassword();

    // 4. 비밀번호를 cache에 저장한다.
    const cacheInserted: boolean = await this.updateRoomPasswordToCache.updateKey({
      namespace: roomInfo.room_id,
      keyName: '',
      updateValue: password_hash,
    });
    if (!cacheInserted) {
      await this.updateRoomPasswordToDb.update({
        uniqueValue: roomInfo.room_id,
        updateColName: dto.user_id,
        updateValue: roomInfo.prev_password,
      }); // 다시 되돌린다.
      await this.updateRoomPasswordToCache.updateKey({
        namespace: roomInfo.room_id,
        keyName: '',
        updateValue: roomInfo.prev_password,
      }); // 다시 돌려야 한다.
      throw new NotChangePassword();
    }
  }
}
