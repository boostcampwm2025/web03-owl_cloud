import { Injectable, Logger } from '@nestjs/common';
import type { RoomCreateLockPort, RoomRouterRepositoryPort, RouterFactoryPort } from '../../ports';
import { RoomEntry } from '../dto';
import { SfuError } from '@error/application/sfu/sfu.error';

@Injectable()
export class CreateRouterUsecase {
  private readonly logger = new Logger(CreateRouterUsecase.name);

  // 기존의 in-memory를 그대로 사용해야 하기때문에 의존성을 그대로 부여
  constructor(
    private readonly roomRepo: RoomRouterRepositoryPort,
    private readonly roomCreateLockRepo: RoomCreateLockPort,
    private readonly routerFactory: RouterFactoryPort,
  ) {}

  async execute(room_id: string): Promise<RoomEntry> {
    // 이미 생성된 router라면
    const roomRouterExist = this.roomRepo.get(room_id);
    if (roomRouterExist && !roomRouterExist.router.closed) {
      return roomRouterExist;
    }

    // 생성 중이라면
    const createRoomRoutingExist = this.roomCreateLockRepo.get(room_id);
    if (createRoomRoutingExist) {
      return createRoomRoutingExist;
    }

    // 아무것도 없다면 새롭게 생성할 수 있다.
    const roomEntry = this.createRoomRouting(room_id);
    this.roomCreateLockRepo.set(room_id, roomEntry);

    return roomEntry;
  }

  private async createRoomRouting(room_id: string): Promise<RoomEntry> {
    try {
      // 여기서 router까지 생성
      const { router, workerIdx, workerPid } = await this.routerFactory.createRouter();

      // 기본 설정
      const roomEntry: RoomEntry = {
        worker_idx: workerIdx,
        room_id,
        router,
        worker_pid: workerPid,
        transport_ids: new Set<string>(),
        created_at: new Date(),
      };

      // 메모리에 저장
      this.roomRepo.set(room_id, roomEntry);

      // router가 만약 내려간다면? ( 근데 worker가 내려가면 애초에 그 방은 내려가니까 worker에 죽음은 그 프로세스 전체에 삭제 )
      router.observer.on('close', () => {
        const closedRouterEntry = this.roomRepo.get(room_id);
        if (closedRouterEntry?.router === router) {
          // 방이랑 worker_id 기록한거 삭제
          this.roomRepo.delete(room_id);
        }
      });

      return roomEntry;
    } catch (err) {
      this.logger.error(err); // error가 발생한다면
      throw new SfuError(err);
    } finally {
      this.roomCreateLockRepo.delete(room_id);
    }
  }
}
