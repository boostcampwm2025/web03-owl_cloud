// 퍼블리셔 symbol
export const REDIS_CHANNEL_PUB = Symbol('REDIS_CHANNEL_PUB');

// 구독자 symbol
export const REDIS_CHANNEL_SUB = Symbol('REDIS_CHANNEL_SUB');

export type SsePayload = {
  data: any;
};

// 웹소켓 채널관련
export const CHANNEL_NAMESPACE = Object.freeze({
  SIGNALING: 'signaling:ws',
} as const);
