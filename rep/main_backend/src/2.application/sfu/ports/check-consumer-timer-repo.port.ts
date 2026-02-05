export interface ConsumerTimerRepositoryPort {
  get(consumer_id: string): NodeJS.Timeout | undefined;
  set(consumer_id: string, timer: NodeJS.Timeout): void;
  delete(consumer_id: string): void;
  clear(consumer_id: string): void;
}
