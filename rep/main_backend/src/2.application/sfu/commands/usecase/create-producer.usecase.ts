// sfu 서버에서 produce를 생성할때 사용하는 usecase라고 할 수 있다.
import { Injectable } from '@nestjs/common';
import {
  CreateProduceResult,
  CreatePropduceDto,
  GetProducerProps,
  InsertProducerDto,
} from '../dto';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import {
  DeleteDataToCache,
  InsertDataToCache,
  UpdateDataToCache,
} from '@app/ports/cache/cache.outbound';
import type { ProducerRepositoryPort, TransportRepositoryPort } from '../../ports';
import { RoomTransportInfo } from '../../queries/dto';
import { SfuError, SfuErrorMessage } from '@error/application/sfu/sfu.error';
import { Producer, RtpParameters, Transport } from 'mediasoup/types'; // domain으로 뺴야함

type CreateProduceUsecaseProps<T> = {
  selectTransportDataFromCache: SelectDataFromCache<T>; // transport_id를 이용해서 해당 데이터를 찾기
  selectUserProducerDataFromCache: SelectDataFromCache<T>; // 개인에 produce 데이터가 cache에 존재하는지 확인
  selectMainProducerDataFromCache: SelectDataFromCache<T>; // main에 produce 데이터가 cache에 존재하는지 확인
  insertUserProducerDataToCache: InsertDataToCache<T>; // 개인 produce 데이터를 cache에 저장
  insertMainProducerDataToCache: InsertDataToCache<T>; // main produce 데이터를 cache에 저장
  deleteUserProducerDataToCache: DeleteDataToCache<T>; // 개인 produce 데이터를 cache에 삭제
  deleteMainProducerDataToCache: DeleteDataToCache<T>; // main produce 데이터를 cache에 삭제
  updateUserProducerDataToCache: UpdateDataToCache<T>; // 만약 이미 produce가 올라가 있으면 상태 업데이트
};

@Injectable()
export class CreateProduceUsecase<T> {
  private readonly selectTransportDataFromCache: CreateProduceUsecaseProps<T>['selectTransportDataFromCache'];
  private readonly selectUserProducerDataFromCache: CreateProduceUsecaseProps<T>['selectUserProducerDataFromCache'];
  private readonly selectMainProducerDataFromCache: CreateProduceUsecaseProps<T>['selectMainProducerDataFromCache'];
  private readonly insertUserProducerDataToCache: CreateProduceUsecaseProps<T>['insertUserProducerDataToCache'];
  private readonly insertMainProducerDataToCache: CreateProduceUsecaseProps<T>['insertMainProducerDataToCache'];
  private readonly deleteUserProducerDataToCache: CreateProduceUsecaseProps<T>['deleteUserProducerDataToCache'];
  private readonly deleteMainProducerDataToCache: CreateProduceUsecaseProps<T>['deleteMainProducerDataToCache'];
  private readonly updateUserProducerDataToCache: CreateProduceUsecaseProps<T>['updateUserProducerDataToCache'];

  constructor(
    private readonly produceRepo: ProducerRepositoryPort,
    private readonly transportRepo: TransportRepositoryPort,
    {
      selectTransportDataFromCache,
      selectUserProducerDataFromCache,
      selectMainProducerDataFromCache,
      insertUserProducerDataToCache,
      insertMainProducerDataToCache,
      deleteUserProducerDataToCache,
      deleteMainProducerDataToCache,
      updateUserProducerDataToCache,
    }: CreateProduceUsecaseProps<T>,
  ) {
    this.selectTransportDataFromCache = selectTransportDataFromCache;
    this.selectUserProducerDataFromCache = selectUserProducerDataFromCache;
    this.selectMainProducerDataFromCache = selectMainProducerDataFromCache;
    this.insertUserProducerDataToCache = insertUserProducerDataToCache;
    this.insertMainProducerDataToCache = insertMainProducerDataToCache;
    this.deleteUserProducerDataToCache = deleteUserProducerDataToCache;
    this.deleteMainProducerDataToCache = deleteMainProducerDataToCache;
    this.updateUserProducerDataToCache = updateUserProducerDataToCache;
  }

  async execute(dto: CreatePropduceDto): Promise<CreateProduceResult> {
    // 1. transport_id를 검증 -> 정합성 체크
    // -> ( user_id, socket_id, room_id, type은 send가 맞는지 확인 ) -> transport id만 저장하기
    const transportInfo: RoomTransportInfo = await this.selectTransportDataFromCache.select({
      namespace: dto.transport_id,
      keyName: '',
    });
    if (
      dto.room_id !== transportInfo.room_id ||
      dto.socket_id !== transportInfo.socket_id ||
      transportInfo.type !== 'send' ||
      dto.user_id !== transportInfo.user_id
    )
      throw new SfuErrorMessage(
        'produce를 위한 transport_id가 올바르지 않습니다 다시 확인해주시길 바랍니다.',
      );

    // 중복 등록하지 않도록 확인해줘야 한다.
    if (dto.type === 'cam' || dto.type === 'mic') {
      // -> 현재 유저값이 존재하는지 확인 ( 여러번 등록하게 하면 안된다. ) -> user_id를 기준으로 찾아야 하고 kind를 기준으로 정보들이 저장될것이다.
      const userProduceProps: GetProducerProps | undefined =
        await this.selectUserProducerDataFromCache.select({
          namespace: `${dto.room_id.trim()}:${dto.user_id.trim()}`.trim(),
          keyName: dto.kind,
        });

      // 만약 존재한다면 producer를 on 하고 그 정보를 전달해준다.
      if (userProduceProps) {
        // producer에서 producer_id에 맞는 producer를 찾고 변경
        const prevProducer = this.produceRepo.get(userProduceProps.producer_id);
        if (!prevProducer) {
          // 삭제 후 아래 로직으로 간다.
          await this.deleteUserProducerDataToCache.deleteKey({
            namespace: `${dto.room_id.trim()}:${dto.user_id.trim()}`.trim(),
            keyName: dto.kind,
          });
        }
        // 아래는 수정 한 후 바로 반환한다.
        else {
          // update 한다.
          if (prevProducer.paused) await prevProducer.resume();
          await this.updateUserProducerDataToCache.updateKey({
            namespace: `${dto.room_id}:${dto.user_id}`,
            keyName: dto.kind,
            updateValue: 'on',
          });

          // 여기서 반환
          return {
            producer_id: userProduceProps.producer_id,
            user_id: dto.user_id,
            status: 'user',
            kind: dto.kind,
            type: userProduceProps.type, // 찾아낸 type으로 하는게 맞는것 같다.
            is_restart: true,
          };
        }
      }
    } else {
      // -> main에 현재 데이터가 존재하는지 확인
      const mainChecked: boolean = await this.selectMainProducerDataFromCache.select({
        namespace: dto.room_id,
        keyName: dto.type,
      });
      if (mainChecked) throw new SfuErrorMessage('현재 main에 다른 컨텐츠가 실행중입니다.');
    }

    // 연결전에 검증을 진행한다. ( video만 진행 )
    if (dto.kind === 'video') {
      const { isVp9, isSvc } = this.analyzeRtp(dto.rtpParameters);
      this.analyze({ dto, isVp9, isSvc });
    }

    // 2. produce 연결
    const transport: Transport | undefined = this.transportRepo.get(dto.transport_id);
    if (!transport) throw new SfuErrorMessage('transport_id가 존재하지 않습니다 다시 확인해주세요');
    const producer: Producer = await transport.produce({
      kind: dto.kind,
      rtpParameters: dto.rtpParameters,
    });

    //
    const producer_id: string = producer.id;

    // 3. produce가 닫히면 관련 정보가 다 삭제 되어야 한다. ( 메모리 + cache )
    // -> cam, mic 이면 개인에 정보 삭제, main이면 main에 정보 삭제
    // -> 메모리에 produce 정보 삭제
    let cleaned = false;

    const cleanup = async (): Promise<void> => {
      if (cleaned) return;
      cleaned = true;

      try {
        // 메모리에서 producer 제거
        if (this.produceRepo.get(producer_id)) {
          this.produceRepo.delete(producer_id);
        }

        // cache에서 producer 정보 제거
        if (dto.type === 'cam' || dto.type === 'mic') {
          await this.deleteUserProducerDataToCache.deleteKey({
            namespace: `${dto.room_id.trim()}:${dto.user_id.trim()}`.trim(),
            keyName: dto.kind,
          });
        } else {
          await this.deleteMainProducerDataToCache.deleteKey({
            namespace: dto.room_id,
            keyName: dto.type,
          });
        }
      } catch (err) {
        console.error('[SFU][ProducerCleanupError]', {
          producer_id,
          room_id: dto.room_id,
          user_id: dto.user_id,
          type: dto.type,
          kind: dto.kind,
          err,
        });
      }
    };

    // produce가 닫히면 관련 정보가 다 삭제 되어야 한다. ( 메모리 + cache )
    producer.on('transportclose', () => {
      void cleanup();
    });
    producer.on('@close', () => {
      void cleanup();
    });

    try {
      // 4. produce를 메모리에 저장
      this.produceRepo.set(producer_id, producer);

      // 5. cache에 관련 정보를 저장
      // -> cam, mic 정보에 대해서 저장, main이라면 main에다 저장 ( 개인 또는 main에 저장 )
      const insertDto: InsertProducerDto = {
        room_id: dto.room_id,
        user_id: dto.user_id,
        producer_id,
        type: dto.type,
        kind: dto.kind,
      };
      let inserted: boolean;
      if (dto.type === 'cam' || dto.type === 'mic') {
        inserted = await this.insertUserProducerDataToCache.insert(insertDto);
      } else {
        inserted = await this.insertMainProducerDataToCache.insert(insertDto);
      }
      if (!inserted) {
        // 에러 뜨면 안됨으로 produce 닫아야 함
        producer.close();
        throw new SfuErrorMessage('cache에 정보를 저장하는데 에러가 발생했습니다.');
      }

      // 6. produce_id 정보 전달, kind, type, user_id 정보 전달
      return {
        producer_id,
        kind: dto.kind,
        user_id: dto.user_id,
        type: dto.type,
        status: dto.type === 'cam' || dto.type === 'mic' ? 'user' : 'main',
        is_restart: false,
      };
    } catch (err) {
      producer.close();
      throw new SfuError(err);
    }
  }

  // produce에서 cam + screen_video부분에서 검증 함수를 추가한다.
  private analyzeRtp(rtp: RtpParameters) {
    // video codec을 확인하고 video가 맞다면
    const videoCodec = rtp.codecs?.find((c) => c.mimeType?.toLowerCase().startsWith('video/'));

    // mime 타입을 확인한다.
    const mime = videoCodec?.mimeType?.toLowerCase();

    // vp9인지 확인하기 위해서
    const isVp9 = mime === 'video/vp9';

    const scalabilityModes = (rtp.encodings ?? [])
      .map((e) => (e as any).scalabilityMode)
      .filter(Boolean) as string[];

    // svc를 쓰는지 3레이어를 쓰는지 확인
    const isSvc = scalabilityModes.length > 0;
    const hasL3T3Key = scalabilityModes.some((m) => m.toUpperCase() === 'L3T3_KEY');

    // 검증을 위한 값들 현재는 SVC를 쓰지 않지만 추후 실험과 테스트를 통해서 검증을 해야 한다.
    return { mime, isVp9, isSvc, scalabilityModes, hasL3T3Key };
  }

  private analyze({
    dto,
    isVp9,
    isSvc,
  }: {
    dto: CreatePropduceDto;
    isVp9: boolean;
    isSvc: boolean;
  }) {
    // cam은 현재 vp9을 지원하지 않는다.
    if (dto.type === 'cam' && isVp9) {
      throw new SfuErrorMessage('cam은 현재 VP9를 지원하지 않습니다. (VP8 simulcast 사용)');
    }

    // screen_video는 현재 svc를 지원하지 않는다 추후 실험을 통해서 지원 가능
    if (dto.type === 'screen_video' && isSvc) {
      throw new SfuErrorMessage('screen_video의 VP9 SVC는 현재 비활성화 상태입니다.');
    }
  }
}
