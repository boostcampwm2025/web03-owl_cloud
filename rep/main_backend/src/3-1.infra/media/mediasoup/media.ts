import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Router, type Worker } from "mediasoup/types";
import * as mediasoup from "mediasoup";
import * as os from "os";
import { mediaSoupRouterConfig, mediaSoupWorkerConfig } from "./config";


@Injectable()
export class MediasoupService implements OnModuleInit, OnModuleDestroy {

  private readonly logger = new Logger(MediasoupService.name);

  // 가용 가능한 worker ( cpu 개수당 보통 한개의 worker를 부여한다. )
  private readonly workers : Array<Worker> = []; // 이 infra에 worker들이 관리한다. ( 나중에 분리 가능 )
  private workerIdx : number = 0; // 현재 worker 위치

  // 처음에 이 모듈의 의존성을 부여할때 실행
  async onModuleInit() : Promise<void> {
    const workerCount : number = Number(Math.min(4, os.cpus().length)) // 일단은 worker = cpu 갯수로 가고 나중에 조정할 수도? ( 최대 4 )

    this.logger.log(`mediasoup에서 가용할 worker의 갯수: ${workerCount}`);

    // worker 생성
    for ( let i = 0; i < workerCount; i++ ) {
      const worker = await mediasoup.createWorker(mediaSoupWorkerConfig);

      // worker가 죽었을때 속성 부여 
      worker.on("died", () => {
        this.logger.warn(`mediasoup에 ${worker.pid} 사망`);
        if (process.env.NODE_ENV === "production") process.exit(1); // 배포환경에서 해당 worker 프로세스를 종료 ( 재시작 루트를 다시 만들어 줘야 한다. -> 배포 환경이라면 ) -> 극단적으로 하는 이유는 이 기능이 거의 가장 핵심이 되기 때문이다. 
      });

      this.workers.push(worker);
    };
  };

  // module이 내려가면 worker를 정리해주어야 한다. ( 안정성 높이기 위해 )
  async onModuleDestroy() : Promise<void> {
    for (const worker of this.workers) {
      try { worker.close(); } catch (e) { this.logger.error(e); }
    }
    this.workers.length = 0; // 메모리에도 삭제
  };

  // worker 가져오기 ( round-robin 알고리즘 사용 )
  picWorker() : { worker : Worker, workerIdx : number} {
    if ( this.workers.length === 0 ) throw new Error("worker가 존재하지 않습니다.");

    const workerIdx : number = this.workerIdx;
    const worker = this.workers[workerIdx];
    this.workerIdx = ( workerIdx + 1 ) % this.workers.length;
    return { worker, workerIdx };
  };

  // 특정 worker 가져오기 
  getWorker(worker_idx : number) : Worker | undefined {
    return this.workers[worker_idx];
  };

  // router 생성해주는 메서드
  async createRouterOnPickedWorker(): Promise<{ router: Router; workerIdx: number; workerPid: number }> {
    const { worker, workerIdx } = this.picWorker();
    const router = await worker.createRouter(mediaSoupRouterConfig);
    return { router, workerIdx, workerPid: worker.pid };
  }

};