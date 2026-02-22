import { SyncState } from '@/types/code-editor';

export const createInitialSyncState = (): SyncState => ({
  lastSeq: 0,
  awaitingAck: false,
  suppressSend: false,
  dirty: false,
  syncReqInFlight: false,
  readySent: false,
  lastSendAt: 0,
});
