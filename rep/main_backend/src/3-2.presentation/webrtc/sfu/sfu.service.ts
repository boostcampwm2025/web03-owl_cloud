import { MediasoupService } from "@infra/media/mediasoup/media";
import { Injectable, Logger } from "@nestjs/common";
import { ConnectTransportType, RoomEntry, TransportEntry } from "./sfu.validate";
import { SfuError, SfuErrorMessage } from "@error/presentation/sfu/sfu.error";
import { mediaSoupRouterConfig, listenIps } from "@infra/media/mediasoup/config";
import { Router, Transport, WebRtcTransport } from "mediasoup/types";
import { CreateSfuTransportInfoToRedis, DeleteSfuTransportInfoToRedis } from "@infra/cache/redis/sfu/sfu.outbound";
import { CreateRoomTransportDto, CreateTransportDto } from "@app/room/commands/dto";
import { CACHE_SFU_NAMESPACE_NAME } from "@infra/cache/cache.constants";
import { SelectSfuTransportDataFromRedis } from "@infra/cache/redis/sfu/sfu.inbound";
import { RoomTransportInfo } from "@/2.application/room/queries/dto";


@Injectable()
export class SfuService {

  // sfu 서버가 관리하는 로직 ( 메모리 낭비가 있는데 어떻게 하면 좀 효율적으로 저장이 가능할까? )
  private readonly logger = new Logger(SfuService.name);
  
  // wokre들과 router 정리
  private readonly roomRouters = new Map<string, RoomEntry>(); // room_id : RoomEntry
  private readonly createRoomRoutings = new Map<string, Promise<RoomEntry>>(); // room_id : Promise<RoomEntry> -> 생성하고 있는 중인 룸

  // transport가 저장이 되야 한다. 
  private readonly transports = new Map<string, WebRtcTransport>(); // transport_id : transport 저장 ( 나중에 transport를  )

  constructor(
    private readonly mediaSoupService : MediasoupService,
    private readonly insertTranportInfoToRedis : CreateSfuTransportInfoToRedis,
    private readonly deleteTransportInfoToRedis : DeleteSfuTransportInfoToRedis,
    private readonly selectSfuTransportInfoFromRedis : SelectSfuTransportDataFromRedis
  ) {}

  private async createRoomRouting(room_id : string) : Promise<RoomEntry> {
    try {
      const { worker, workerIdx } = this.mediaSoupService.picWorker(); 

      // 여기서 허용 가능한 router에 config를 부여할 수 있다. 
      const router = await worker.createRouter(
        mediaSoupRouterConfig
      ); 

      // 기본 설정
      const roomEntry : RoomEntry = {
        worker_idx : workerIdx,
        room_id,
        router,
        worker_pid : worker.pid,
        transport_ids : new Set<string>(),
        created_at : new Date()
      };

      // 메모리에 저장
      this.roomRouters.set(room_id, roomEntry);

      // router가 만약 내려간다면? ( 근데 worker가 내려가면 애초에 그 방은 내려가니까 worker에 죽음은 그 프로세스 전체에 삭제 )
      router.observer.on("close", () => {
        const closedRouterEntry = this.roomRouters.get(room_id);
        if ( closedRouterEntry?.router === router ) {
          // 방이랑 worker_id 기록한거 삭제
          this.roomRouters.delete(room_id);
        };
      });

      // 여기에서 대표 producer transport도 나중에 등록 예정

      return roomEntry;
    } catch (err) {
      this.logger.error(err); // error가 발생한다면 
      throw new SfuError(err);
    } finally {
      this.createRoomRoutings.delete(room_id);
    };
  };

  // 1. router 생성 관련 함수 -> 생성 혹은 얻는 이유는 방을 만들었다고 무조건 router를 부여하면 비어있는 방에 낭비가 심할 수 있기에 들어와야 활성화가 된다. 
  async getOrCreateRoomRouter(room_id : string) : Promise<RoomEntry> {
    
    // 이미 생성된 router라면
    const roomRouterExist = this.roomRouters.get(room_id); 
    if ( roomRouterExist && !roomRouterExist.router.closed ) {
      return roomRouterExist;
    };

    // 생성 중이라면 
    const createRoomRoutingExist = this.createRoomRoutings.get(room_id);
    if ( createRoomRoutingExist ) {
      return createRoomRoutingExist;
    };

    // 아무것도 없다면 새롭게 생성할 수 있다.
    const roomEntry = this.createRoomRouting(room_id);
    this.createRoomRoutings.set(room_id, roomEntry);

    return roomEntry;
  };

  // 방이 닫혔을때 로직도 구현해두자
  closeRoomRouter(room_id : string) : void {
    const entry = this.roomRouters.get(room_id);
    if ( !entry ) return;

    // transport를 관리
    for (const transport_id of entry.transport_ids) {
      const t = this.transports.get(transport_id);
      if (t && !t.closed) {
        try { t.close(); } catch {}
      }
      this.transports.delete(transport_id);
    };

    try {
      if (!entry.router.closed) entry.router.close();
    } finally {
      this.roomRouters.delete(room_id); // 근데 생각해보면 close를 해두어서 삭제되기는 할거다. 
    };
  };  

  // room의 정보를 최신으로 바꾸는 로직이다.
  private patchRoomEntry(room_id : string, patch : (entry : RoomEntry) => void) : void {
    const entry = this.roomRouters.get(room_id);
    if ( !entry ) return;
    patch(entry);

    this.roomRouters.set(room_id, entry);
  };

  private transPortLogging(room_id : string, transport : WebRtcTransport) : void {
    // transport에 대해서 내부 디버깅을 위해서 추가

    // ice 상태에 대해서 로깅
    transport.on("icestatechange", (state) => {
      this.logger.debug({room_id, transportId : transport.id, state}, "transport에 ice부분에 상태가 변했습니다.");
    });

    // dtls 핸드세이킹 과정중 상태변화 로깅
    transport.on("dtlsstatechange", (state) => {
      this.logger.debug({room_id, transportId : transport.id, state}, "transport에 dtls부분에 상태가 변했습니다.");
    });
  };

  // 2. transport 부분 생성 ( 나중에 전체적인 부분 usecase로 빼자고 )
  async createTransPort(dto : CreateTransportDto) : Promise<TransportEntry> {

    const roomEntry = this.roomRouters.get(dto.room_id);
    if ( !roomEntry ) throw new SfuErrorMessage("room_id를 다시 확인해주세요");
    const router : Router = roomEntry.router;

    let transport : WebRtcTransport | undefined;

    try {
      // ip 설정을 해두고 
      transport = await router.createWebRtcTransport({
        listenIps,
        enableUdp : true, // udp 허용
        enableTcp : true, // tcp 허용
        preferUdp : true, // udp가 최우선
        initialAvailableOutgoingBitrate: 1_000_000, // 첫 바이트는 이정도 
      });

      // transport 로깅
      this.transPortLogging(dto.room_id, transport);

      // 최대 전송율 정하기 
      try {
        await transport.setMaxIncomingBitrate(1_500_000); // 최대 
      } catch (err) {
        this.logger.warn(err); // 에러 메시지만 이유는 화면공유, 음성, 비디오등 다 다른데 하나로 고정할수는 없음 ( 상황에 따라서 나중에 개선해야 함 )
      }     

      // transport id를 가져온다. 
      const transportId : string = transport.id;

      // 메모리에 저장
      this.transports.set(transportId, transport);
      
      // router 갱신
      this.patchRoomEntry(dto.room_id, (entry) => {
        entry.transport_ids.add(transportId);
      });

      // cache에 정보 저장
      const validate : CreateRoomTransportDto = {
        ...dto,
        transport_id : transportId
      }
      await this.insertTranportInfoToRedis.insert(validate);

      // transport 없어졌을때 이벤트 생성
      transport.observer.on("close", () => {
        this.transports.delete(transportId);

        // router 갱신
        this.patchRoomEntry(dto.room_id, (entry) => {
          entry.transport_ids.delete(transportId);
        });

        // cache에 삭제
        const namespace : string = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${transportId}`;
        this.deleteTransportInfoToRedis.deleteNamespace(namespace);
      });
      
      return {
        transportId: transportId,
        iceParameters: transport.iceParameters, // ice에 파라미터 정보
        iceCandidates: transport.iceCandidates, // ice 후보들 전달
        dtlsParameters: transport.dtlsParameters // dtls 핸드세이크를 위한 파라미터들
      };
    } catch (err) {
      if ( transport && !transport.closed ) transport.close();
      throw err;
    }

  };

  // 3. transport connect 연결 ( 이때 부터는 이제 sfu와 webrtc 통신이 가능해졌다고 생각하면 된다. )
  async connectTransport(dto : ConnectTransportType) : Promise<void> {
    // 검증하기
    const namespace : string = `${CACHE_SFU_NAMESPACE_NAME.TRANSPORT_INFO}:${dto.transport_id}`;
    const transportInfo : RoomTransportInfo | undefined = await this.selectSfuTransportInfoFromRedis.select({ namespace, keyName : "" });
    if ( !transportInfo ) throw new SfuErrorMessage("transport_id를 다시 확인해주세요. - 데이터 찾는데 문제 발생");
    
    if ( dto.room_id !== transportInfo.room_id || dto.socket_id !== transportInfo.socket_id || dto.type !== transportInfo.type || dto.user_id !== transportInfo.user_id ) throw new SfuErrorMessage("잘못된 transport_id에 연결하고자 합니다 다시 확인해주시길 발반디ㅏ.");

    // transport 가져오기
    const transport : Transport | undefined = this.transports.get(dto.transport_id);

    if ( !transport ) throw new SfuErrorMessage("transport_id를 다시 확인해주세요.");

    await transport.connect({ dtlsParameters : dto.dtlsParameters });
  };

};