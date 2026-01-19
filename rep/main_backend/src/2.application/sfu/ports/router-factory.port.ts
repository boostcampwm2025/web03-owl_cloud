import type { Router } from 'mediasoup/types';

export type CreateRouterResult = {
  router: Router;
  workerIdx: number;
  workerPid: number;
};

export interface RouterFactoryPort {
  createRouter(): Promise<CreateRouterResult>;
}
