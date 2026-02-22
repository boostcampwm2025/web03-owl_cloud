import type { RefObject } from 'react';
import type * as Y from 'yjs';
import type { Socket } from 'socket.io-client';
import * as YRuntime from 'yjs';
import * as Sentry from '@sentry/nextjs';

import {
  SyncState,
  YjsInitPayload,
  YjsRemoteUpdate,
  YjsSyncReqPayload,
  YjsSyncServerPayload,
  YjsUpdateClientPayload,
} from '@/types/code-editor';
import { captureError, syncLog } from '@/utils/logging';
import { ErrorType } from '@/types/error';
import {
  BUFFER_WINDOW_MS,
  MAX_MERGED_BYTES,
  MAX_PENDING_UPDATES,
} from './constants';

type SetupSyncBridgeParams = {
  socket: Socket;
  ydoc: Y.Doc;
  yText: Y.Text;
  syncStateRef: RefObject<SyncState>;
  pendingUpdatesRef: RefObject<Uint8Array[]>;
  mergeTimerRef: RefObject<NodeJS.Timeout | null>;
  remoteOrigin: symbol;
};

export const setupSyncBridge = ({
  socket,
  ydoc,
  yText,
  syncStateRef,
  pendingUpdatesRef,
  mergeTimerRef,
  remoteOrigin,
}: SetupSyncBridgeParams) => {
  const applyUpdatesNoSend = (updates: ArrayBuffer[]) => {
    syncStateRef.current.suppressSend = true;

    const before = yText.length;

    try {
      ydoc.transact(() => {
        for (const update of updates) {
          YRuntime.applyUpdate(ydoc, new Uint8Array(update));
        }
      }, remoteOrigin);

      const after = yText.length;

      syncLog('sync.remote.apply.result', {
        before,
        after,
        delta: after - before,
        updates: updates.length,
      });

      if (before > 0 && after === 0) {
        syncLog(
          'sync.anomaly.text_wipe',
          {
            before,
            updates: updates.length,
          },
          'error',
        );
      }
    } catch (error) {
      captureError({
        error,
        type: ErrorType.SYNC,
        message: 'Yjs 트랜잭션 적용 실패',
        extra: { updateCount: updates.length },
      });
    } finally {
      syncStateRef.current.suppressSend = false;
    }
  };

  const requestSync = (reason: YjsSyncReqPayload['reason'] = 'SEQ_GAP') => {
    if (syncStateRef.current.syncReqInFlight) return;

    // [모니터링] 시퀀스 갭 발생 시 Sentry 카운트 증가
    Sentry.metrics.count('editor.sync.gap', 1, { attributes: { reason } });

    syncStateRef.current.syncReqInFlight = true;

    socket.emit('yjs-sync-req', {
      last_seq: syncStateRef.current.lastSeq,
      reason,
    } satisfies YjsSyncReqPayload);

    setTimeout(() => {
      syncStateRef.current.syncReqInFlight = false;
    }, 1500);
  };

  const clearPendingUpdates = () => {
    pendingUpdatesRef.current = [];

    if (mergeTimerRef.current) {
      clearTimeout(mergeTimerRef.current);
      mergeTimerRef.current = null;
    }
  };

  const sendFullStateOnce = () => {
    if (syncStateRef.current.awaitingAck) {
      syncStateRef.current.dirty = true;
      return;
    }

    const full = YRuntime.encodeStateAsUpdate(ydoc);
    syncStateRef.current.awaitingAck = true;
    syncStateRef.current.dirty = false;
    syncStateRef.current.lastSendAt = performance.now(); // 측정용

    socket.emit('yjs-update', {
      last_seq: syncStateRef.current.lastSeq,
      update: full,
    } satisfies YjsUpdateClientPayload);

    syncLog(
      'emit-full-state',
      {
        lastSeq: syncStateRef.current.lastSeq,
        bytes: full.length,
      },
      'info',
    );
  };

  const emitMergedUpdates = () => {
    const updates = pendingUpdatesRef.current;
    if (updates.length === 0) return;

    const merged = YRuntime.mergeUpdates(updates);

    if (merged.byteLength > MAX_MERGED_BYTES) {
      syncLog(
        'sync.merge.fallback.full_state',
        { mergedBytes: merged.byteLength },
        'warning',
      );
      sendFullStateOnce();
    } else {
      syncStateRef.current.awaitingAck = true;
      syncStateRef.current.lastSendAt = performance.now();

      socket.emit('yjs-update', {
        last_seq: syncStateRef.current.lastSeq,
        update: merged,
      } satisfies YjsUpdateClientPayload);

      syncLog('sync.emit.merged_update', {
        updates: updates.length,
        bytes: merged.byteLength,
      });
    }

    clearPendingUpdates();
  };

  const scheduleMergeEmit = () => {
    if (mergeTimerRef.current) return;

    mergeTimerRef.current = setTimeout(() => {
      emitMergedUpdates();
    }, BUFFER_WINDOW_MS);
  };

  // Socket -> Yjs (init)
  const onYjsInit = (data: YjsInitPayload) => {
    syncLog(
      'yjs-init',
      {
        seq: data.seq,
        size: data.update?.byteLength,
      },
      'info',
    );

    applyUpdatesNoSend([data.update]);
    syncStateRef.current.lastSeq = data.seq;

    syncStateRef.current.awaitingAck = false;
    syncStateRef.current.dirty = false;
    syncStateRef.current.syncReqInFlight = false;
  };

  // Socket -> Yjs (sync)
  const onYjsSync = (msg: YjsSyncServerPayload) => {
    if (!msg.ok) {
      captureError({
        error: new Error('SYNC_SERVER_ERROR'),
        type: ErrorType.SYNC,
        message: '서버 동기화 응답 거부',
        extra: { payload: msg },
      });

      syncStateRef.current.awaitingAck = false;
      syncStateRef.current.syncReqInFlight = false;
      return;
    }

    if (msg.type === 'ack') {
      const rtt = performance.now() - syncStateRef.current.lastSendAt;
      syncLog('sync.ack.received', {
        serverSeq: msg.server_seq,
        rtt,
        dirtyAfterAck: syncStateRef.current.dirty,
      });

      syncStateRef.current.lastSeq = Math.max(
        syncStateRef.current.lastSeq,
        msg.server_seq,
      );
      syncStateRef.current.awaitingAck = false;
      syncStateRef.current.syncReqInFlight = false;

      if (syncStateRef.current.dirty && pendingUpdatesRef.current.length > 0) {
        syncLog(
          'sync.flush.after_ack',
          { pending: pendingUpdatesRef.current.length },
          'info',
        );
        emitMergedUpdates();
      }
      return;
    }

    if (msg.type === 'full' || msg.type === 'patch') {
      const rtt = performance.now() - syncStateRef.current.lastSendAt;
      Sentry.metrics.distribution('editor.sync.rtt', rtt, {
        unit: 'millisecond',
      });

      if (rtt > 500) {
        syncLog(
          'high-latency',
          {
            rtt,
            type: msg.type,
          },
          'warning',
        );
      }

      applyUpdatesNoSend(msg.type === 'full' ? [msg.update] : msg.updates);

      const syncLatestSeq = msg.type === 'full' ? msg.server_seq : msg.to_seq;

      syncStateRef.current.lastSeq = Math.max(
        syncStateRef.current.lastSeq,
        syncLatestSeq,
      );

      syncStateRef.current.awaitingAck = false;
      syncStateRef.current.syncReqInFlight = false;

      if (msg.origin === 'UPDATE_REJECTED') {
        sendFullStateOnce();
      }
    }
  };

  // Socket -> Yjs (remote updates)
  const onYjsRemoteUpdate = (msg: YjsRemoteUpdate) => {
    if ('seq' in msg) {
      const expected = syncStateRef.current.lastSeq + 1;

      if (msg.seq !== expected) {
        syncLog(
          'sync.anomaly.seq_gap',
          {
            expected,
            got: msg.seq,
            awaitingAck: syncStateRef.current.awaitingAck,
            dirty: syncStateRef.current.dirty,
          },
          'error',
        );

        requestSync('SEQ_GAP');
        return;
      }

      syncLog('sync.remote.apply', {
        seq: msg.seq,
        bytes: msg.update.byteLength,
      });

      applyUpdatesNoSend([msg.update]);
      syncStateRef.current.lastSeq = msg.seq;
      syncStateRef.current.syncReqInFlight = false;
      return;
    }

    const expectedFrom = syncStateRef.current.lastSeq + 1;

    if (msg.from_seq !== expectedFrom) {
      requestSync('SEQ_GAP');
      return;
    }

    applyUpdatesNoSend(msg.updates);
    syncStateRef.current.lastSeq = msg.to_seq;
    syncStateRef.current.syncReqInFlight = false;
  };

  // Yjs -> Socket (local updates)
  const onYdocUpdate = (update: Uint8Array, origin: unknown) => {
    syncLog('sync.local.update', {
      bytes: update.length,
      awaitingAck: syncStateRef.current.awaitingAck,
      dirty: syncStateRef.current.dirty,
      lastSeq: syncStateRef.current.lastSeq,
    });

    if (origin === remoteOrigin) return;
    if (syncStateRef.current.suppressSend) return;

    syncStateRef.current.dirty = true;

    if (syncStateRef.current.awaitingAck) {
      pendingUpdatesRef.current.push(update);

      syncLog(
        'sync.local.buffered',
        {
          pending: pendingUpdatesRef.current.length,
          bytes: update.length,
        },
        'warning',
      );

      // overflow 방어
      if (pendingUpdatesRef.current.length >= MAX_PENDING_UPDATES) {
        syncLog(
          'sync.buffer.overflow',
          { pending: pendingUpdatesRef.current.length },
          'error',
        );
        sendFullStateOnce();
        clearPendingUpdates();
      } else {
        scheduleMergeEmit();
      }
      return;
    }

    syncStateRef.current.awaitingAck = true;
    syncStateRef.current.dirty = false;
    syncStateRef.current.lastSendAt = performance.now();

    socket.emit('yjs-update', {
      last_seq: syncStateRef.current.lastSeq,
      update,
    } satisfies YjsUpdateClientPayload);

    syncLog('sync.emit.update', {
      seq: syncStateRef.current.lastSeq,
      bytes: update.length,
    });
  };

  socket.on('yjs-init', onYjsInit);
  socket.on('yjs-sync', onYjsSync);
  socket.on('yjs-update', onYjsRemoteUpdate);
  ydoc.on('update', onYdocUpdate);

  if (!syncStateRef.current.readySent) {
    syncStateRef.current.readySent = true;
    socket.emit('yjs-ready');
  }

  return () => {
    socket.off('yjs-init', onYjsInit);
    socket.off('yjs-sync', onYjsSync);
    socket.off('yjs-update', onYjsRemoteUpdate);
    ydoc.off('update', onYdocUpdate);
    clearPendingUpdates();
  };
};
