import React, { useCallback, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

const SERVER_URL = 'http://localhost:8080';
const SOCKET_PATH = '/api/ws/';
const NAMESPACE = '/signal';

const EV = {
  JOIN_ROOM: 'signaling:ws:join_room',
  NEGOTIATE_SDP: 'signaling:ws:negotiate_sdp',
  NEGOTIATE_ICE: 'signaling:ws:negotiate_ice',
  DTLS_HANDSHAKE: 'signaling:ws:dtls_handshake',
  PRODUCE: 'signaling:ws:produce',
  CONSUME: 'signaling:ws:consume',
  RESUME: 'signaling:ws:resume',
  ROOM_MEMBERS: 'signaling:ws:room_members',
};

const CLIENT_EV = {
  JOINED: 'room:joined',
  NEW_PRODUCED: 'room:new_produced',
  NEW_USER: 'room:new_user',
};

function now() {
  return new Date().toISOString().slice(11, 23);
}

/**
 * 서버 GetRoomMembersResult 모양이 확정되면 여기만 고치면 됨.
 * - members: MembersInfo[]
 * - producers: RoomProducerInfo[] (optional)
 */
function pickOk(res) {
  if (!res) return true;
  if (typeof res.ok === 'boolean') return res.ok;
  return true;
}
function pickMembers(res) {
  if (!res) return [];
  return (
    res.members ||
    res.room_members ||
    res.roomMembers ||
    res.data?.members ||
    []
  );
}
function pickProducers(res) {
  if (!res) return [];
  return (
    res.producers ||
    res.room_producers ||
    res.roomProducers ||
    res.data?.producers ||
    []
  );
}

export default function TempMeetingLobby() {
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);

  // consumer 관리
  const consumersRef = useRef(new Map()); // serverProducerId -> mediasoupClient.Consumer
  const consumerIdRef = useRef(new Map()); // serverProducerId -> consumer_id
  const producedSetRef = useRef(new Set()); // producerId 중복 consume 방지

  // local media
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);

  // screen share
  const screenStreamRef = useRef(null);
  const screenVideoProducerRef = useRef(null);
  const screenAudioProducerRef = useRef(null);
  const [screenSharing, setScreenSharing] = useState(false);

  // remote media
  const [remoteStreams, setRemoteStreams] = useState([]); // [{producer_id, kind, type, stream, status}]
  const remoteVideoRefs = useRef(new Map()); // producer_id -> videoEl
  const remoteAudioRefs = useRef(new Map()); // producer_id -> audioEl

  // members
  const [members, setMembers] = useState([]);
  const memberMapRef = useRef(new Map()); // key(socket_id||user_id) -> member

  // ui
  const [accessToken, setAccessToken] = useState('');
  const [roomId, setRoomId] = useState('test-room-1'); // UI only
  const [nickname, setNickname] = useState('tester');
  const [code, setCode] = useState('kcSTxbEpoOYl0FjSztN7kgEI9RwiuVGI');

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const [logs, setLogs] = useState([]);

  const pushLog = useCallback((msg, obj) => {
    setLogs((prev) => {
      const line = obj
        ? `${now()}  ${msg}  ${JSON.stringify(obj)}`
        : `${now()}  ${msg}`;
      return [line, ...prev].slice(0, 300);
    });
  }, []);

  const emitAck = useCallback(async (socket, event, payload) => {
    return new Promise((resolve) => {
      socket.emit(event, payload, (res) => resolve(res));
    });
  }, []);

  const attachRemote = useCallback(async (producer_id, kind, stream) => {
    try {
      if (kind === 'video') {
        const el = remoteVideoRefs.current.get(producer_id);
        if (el && el.srcObject !== stream) {
          el.srcObject = stream;
          await el.play().catch(() => {});
        }
      } else {
        const el = remoteAudioRefs.current.get(producer_id);
        if (el && el.srcObject !== stream) {
          el.srcObject = stream;
          await el.play().catch(() => {});
        }
      }
    } catch {}
  }, []);

  /**
   * ✅ RESUME (consumer_id만 보내는 버전)
   */
  const resumeConsumer = useCallback(
    async ({ producer_id }) => {
      const socket = socketRef.current;
      if (!socket?.connected)
        return pushLog('⚠️ socket not connected (resume)');

      const consumer_id = consumerIdRef.current.get(producer_id);
      if (!consumer_id)
        return pushLog('⚠️ consumer_id missing (resume)', { producer_id });

      try {
        const ack = await emitAck(socket, EV.RESUME, { consumer_id });
        pushLog('⬅️ RESUME ack', ack);

        if (ack?.ok === false) throw new Error('RESUME not ok');

        const c = consumersRef.current.get(producer_id);
        if (c && c.paused) {
          await c.resume();
          pushLog('✅ client consumer resumed', { producer_id, consumer_id });
        }
      } catch (e) {
        pushLog('❌ resumeConsumer failed', {
          message: e?.message,
          producer_id,
          consumer_id,
        });
      }
    },
    [emitAck, pushLog],
  );

  /**
   * ✅ consumeOne
   */
  const consumeOne = useCallback(
    async (producerInfo, status = 'user') => {
      const socket = socketRef.current;
      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;

      const incomingProducerId =
        producerInfo?.producer_id || producerInfo?.producerId;
      const kindHint = producerInfo?.kind;
      const type = producerInfo?.type;

      if (!socket?.connected)
        return pushLog('⚠️ socket not connected (consume)');
      if (!device) return pushLog('⚠️ device not loaded (consume)');
      if (!recvTransport)
        return pushLog('⚠️ recvTransport not ready (consume)');
      if (!incomingProducerId)
        return pushLog('⚠️ producer_id missing (consume)');

      if (producedSetRef.current.has(incomingProducerId)) {
        pushLog('ℹ️ already consumed - skip', {
          producer_id: incomingProducerId,
        });
        return;
      }

      try {
        const res = await emitAck(socket, EV.CONSUME, {
          transport_id: recvTransport.id,
          producer_id: incomingProducerId,
          rtpCapabilities: device.rtpCapabilities,
          status,
        });

        pushLog('⬅️ CONSUME ack', res);

        const consumerInfo = res?.consumerInfo || res?.consumer_info || res;

        const consumerIdFromServer =
          consumerInfo?.id ||
          consumerInfo?.consumer_id ||
          consumerInfo?.consumerId;

        const serverProducerId =
          consumerInfo?.producerId ||
          consumerInfo?.producer_id ||
          incomingProducerId;

        const serverKind = consumerInfo?.kind || kindHint;
        const rtpParameters = consumerInfo?.rtpParameters;

        if (
          !consumerIdFromServer ||
          !serverProducerId ||
          !serverKind ||
          !rtpParameters
        ) {
          throw new Error('consumerInfo fields missing');
        }

        if (producedSetRef.current.has(serverProducerId)) {
          pushLog('ℹ️ already consumed - skip (serverProducerId)', {
            producer_id: serverProducerId,
          });
          return;
        }

        const consumer = await recvTransport.consume({
          id: consumerIdFromServer,
          producerId: serverProducerId,
          kind: serverKind,
          rtpParameters,
        });

        consumersRef.current.set(serverProducerId, consumer);
        consumerIdRef.current.set(serverProducerId, consumerIdFromServer);
        producedSetRef.current.add(serverProducerId);

        const stream = new MediaStream([consumer.track]);

        setRemoteStreams((prev) => {
          if (prev.some((x) => x.producer_id === serverProducerId)) return prev;
          return [
            ...prev,
            {
              producer_id: serverProducerId,
              kind: serverKind,
              type,
              status,
              stream,
            },
          ];
        });

        pushLog('✅ consumed track ready', {
          producer_id: serverProducerId,
          consumer_id: consumerIdFromServer,
          kind: serverKind,
          type,
          status,
          paused: consumer.paused,
        });

        consumer.on('transportclose', () =>
          pushLog('🧩 consumer transportclose', {
            producer_id: serverProducerId,
          }),
        );
        consumer.on('producerclose', () =>
          pushLog('🧩 consumer producerclose', {
            producer_id: serverProducerId,
          }),
        );

        await resumeConsumer({ producer_id: serverProducerId });
        await attachRemote(serverProducerId, serverKind, stream);
      } catch (e) {
        pushLog('❌ consumeOne failed', {
          message: e?.message,
          producer_id: incomingProducerId,
        });
      }
    },
    [attachRemote, emitAck, pushLog, resumeConsumer],
  );

  /**
   * ✅ ROOM_MEMBERS 동기화 (자동 호출용 핵심)
   * - members를 state에 세팅
   * - (옵션) producers가 같이 오면 자동 consume 가능
   */
  const syncRoomMembersSafe = useCallback(
    async ({ reason = 'manual', autoConsume = false } = {}) => {
      const socket = socketRef.current;
      if (!socket?.connected)
        return pushLog('⚠️ socket not connected (room_members)');

      try {
        const res = await emitAck(socket, EV.ROOM_MEMBERS, {});
        pushLog(`⬅️ ROOM_MEMBERS ack (${reason})`, res);

        if (!pickOk(res)) throw new Error('ROOM_MEMBERS not ok');

        const list = pickMembers(res);
        const producers = pickProducers(res);

        const nextMap = new Map();
        for (const m of list) {
          const key = m.socket_id || m.socketId || m.user_id || m.userId;
          if (!key) continue;
          nextMap.set(key, m);
        }

        memberMapRef.current = nextMap;
        setMembers(Array.from(nextMap.values()));
        pushLog('✅ members synced', { count: nextMap.size });

        if (autoConsume && Array.isArray(producers) && producers.length > 0) {
          if (!recvTransportRef.current || !deviceRef.current) {
            pushLog(
              '⚠️ cannot auto-consume yet (recvTransport/device not ready)',
              { producers: producers.length },
            );
            return;
          }

          pushLog('🎯 auto consume producers from ROOM_MEMBERS', {
            count: producers.length,
          });
          for (const p of producers) {
            const producer_id = p.producer_id || p.producerId;
            if (!producer_id) continue;
            if (producedSetRef.current.has(producer_id)) continue;

            const status =
              p.type === 'screen_video' || p.type === 'screen_audio'
                ? 'main'
                : 'user';
            await consumeOne(p, status);
          }
        }
      } catch (e) {
        pushLog('❌ ROOM_MEMBERS failed', { message: e?.message });
      }
    },
    [consumeOne, emitAck, pushLog],
  );

  // screen share stop/start
  const stopScreenShare = useCallback(() => {
    try {
      screenVideoProducerRef.current?.close?.();
      screenAudioProducerRef.current?.close?.();
    } catch {}

    screenVideoProducerRef.current = null;
    screenAudioProducerRef.current = null;

    const s = screenStreamRef.current;
    if (s) s.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    setScreenSharing(false);
    pushLog('🧹 screen share stopped');
  }, [pushLog]);

  const startScreenShare = useCallback(async () => {
    const transport = sendTransportRef.current;
    const device = deviceRef.current;

    if (!device) return pushLog('⚠️ device not loaded');
    if (!transport) return pushLog('⚠️ sendTransport not ready');

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = screenStream;
      setScreenSharing(true);

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const screenAudioTrack = screenStream.getAudioTracks()[0];

      if (screenVideoTrack) {
        screenVideoTrack.onended = () => {
          pushLog('🧩 screen track ended (user stopped share)');
          stopScreenShare();
        };
      }

      if (screenVideoTrack && device.canProduce('video')) {
        const p = await transport.produce({
          track: screenVideoTrack,
          appData: { type: 'screen_video' },
          encodings: [{ maxBitrate: 2_500_000 }],
          codecOptions: { videoGoogleStartBitrate: 1500 },
        });
        screenVideoProducerRef.current = p;
        pushLog('🖥️ screen_video producer created', { id: p.id });
      }

      if (screenAudioTrack && device.canProduce('audio')) {
        const p = await transport.produce({
          track: screenAudioTrack,
          appData: { type: 'screen_audio' },
          codecOptions: { opusStereo: true, opusDtx: true },
        });
        screenAudioProducerRef.current = p;
        pushLog('🔊 screen_audio producer created', { id: p.id });
      }
    } catch (e) {
      setScreenSharing(false);
      pushLog('❌ startScreenShare failed', { message: e?.message });
    }
  }, [pushLog, stopScreenShare]);

  /**
   * ✅ connectSocket (리스너는 여기서만 등록!)
   */
  const connectSocket = useCallback(async () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      auth: accessToken ? { access_token: accessToken } : {},
      withCredentials: true,
      reconnection: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      pushLog('✅ socket connected', { id: socket.id });
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      setJoined(false);

      setMembers([]);
      memberMapRef.current.clear();

      pushLog('🧩 socket disconnected', { reason });
    });

    socket.on('connect_error', (err) => {
      pushLog('❌ connect_error', { message: err.message });
    });

    socket.on(CLIENT_EV.JOINED, async (data) => {
      setJoined(true);
      pushLog('✅ JOINED event received', data);

      // ✅ 새로 들어온 유저: join 직후 members 동기화 (본인 입장 확정 용도)
      await syncRoomMembersSafe({ reason: 'after_joined', autoConsume: false });
    });

    // ✅ 기존 유저들이 받는 이벤트 (새로 들어온 사람이 DTLS 끝낸 뒤 브로드캐스트됨)
    socket.on(CLIENT_EV.NEW_USER, async (userInfo) => {
      pushLog('👋 NEW_USER received', userInfo);

      const key =
        userInfo?.socket_id ||
        userInfo?.socketId ||
        userInfo?.user_id ||
        userInfo?.userId;
      if (!key) {
        // key 없다면 전체 재동기화
        await syncRoomMembersSafe({
          reason: 'new_user_no_key',
          autoConsume: false,
        });
        return;
      }

      // members에 즉시 반영 (중복 방지)
      const next = new Map(memberMapRef.current);
      next.set(key, userInfo);
      memberMapRef.current = next;
      setMembers(Array.from(next.values()));
    });

    socket.on(CLIENT_EV.NEW_PRODUCED, async (producerInfo) => {
      pushLog('📥 NEW_PRODUCED received', producerInfo);

      const pid = producerInfo?.producer_id || producerInfo?.producerId;
      if (!pid) return;

      if (producedSetRef.current.has(pid)) return;

      if (!recvTransportRef.current || !deviceRef.current) {
        pushLog('⚠️ cannot consume yet (recvTransport/device not ready)', {
          producer_id: pid,
        });
        return;
      }

      const t = producerInfo?.type;
      const status =
        t === 'screen_video' || t === 'screen_audio' ? 'main' : 'user';
      await consumeOne(producerInfo, status);
    });

    socket.on('auth:access_token', (data) => {
      pushLog('🔐 auth:access_token received', data);
      console.log(data);
    });
  }, [accessToken, consumeOne, pushLog, syncRoomMembersSafe]);

  const joinRoom = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    const payload = { code: code.trim(), nickname: nickname.trim() };
    if (payload.code.length !== 32) {
      pushLog('❌ code must be exactly 32 chars', { len: payload.code.length });
      return;
    }

    socket.emit(EV.JOIN_ROOM, payload);
    pushLog('➡️ emit JOIN_ROOM', payload);
  }, [code, nickname, pushLog]);

  const negotiateSdpAndLoadDevice = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket?.connected) return pushLog('⚠️ socket not connected');
    if (!joined) return pushLog('⚠️ not joined yet');

    try {
      const res = await emitAck(socket, EV.NEGOTIATE_SDP, {});
      pushLog('⬅️ NEGOTIATE_SDP ack', res);

      const rtpCaps = res?.rtpCapabilities || res?.rtp_capabilities;
      if (!rtpCaps) return pushLog('❌ invalid rtpCapabilities response');

      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCaps });
      deviceRef.current = device;

      pushLog('✅ mediasoup Device loaded', {
        canProduceAudio: device.canProduce('audio'),
        canProduceVideo: device.canProduce('video'),
      });
    } catch (e) {
      pushLog('❌ NEGOTIATE_SDP failed', { message: e?.message });
    }
  }, [emitAck, joined, pushLog]);

  const createTransport = useCallback(
    async (type) => {
      const socket = socketRef.current;
      const device = deviceRef.current;
      if (!socket?.connected) return (pushLog('⚠️ socket not connected'), null);
      if (!device)
        return (pushLog('⚠️ device not loaded (run SDP first)'), null);

      const res = await emitAck(socket, EV.NEGOTIATE_ICE, { type });
      pushLog(`⬅️ NEGOTIATE_ICE(${type}) ack`, res);

      const opt = res?.transportOptions;
      if (!opt) return (pushLog('❌ invalid transportOptions response'), null);

      const transportOptions = {
        id: opt.transportId || opt.transport_id || opt.id,
        iceParameters: opt.iceParameters,
        iceCandidates: opt.iceCandidates,
        dtlsParameters: opt.dtlsParameters,
      };

      let transport;
      if (type === 'send') {
        transport = device.createSendTransport(transportOptions);
        sendTransportRef.current = transport;
      } else {
        transport = device.createRecvTransport(transportOptions);
        recvTransportRef.current = transport;
      }

      pushLog(`✅ ${type} transport created`, { id: transport.id });

      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          pushLog(`➡️ DTLS_HANDSHAKE(${type}) emit`, {
            transport_id: transport.id,
          });

          const ack = await emitAck(socket, EV.DTLS_HANDSHAKE, {
            transport_id: transport.id,
            dtlsParameters,
            type,
          });

          pushLog(`⬅️ DTLS_HANDSHAKE(${type}) ack`, ack);

          if (ack?.ok === false) throw new Error('DTLS_HANDSHAKE not ok');

          callback();
          pushLog(`✅ ${type} transport connect callback done`, {
            dtlsState: transport.dtlsState,
          });

          // ✅ DTLS 이후 한 번 더 members sync (선택: 상태 정합성)
          await syncRoomMembersSafe({
            reason: `after_dtls_${type}`,
            autoConsume: false,
          });
        } catch (e) {
          errback(e);
          pushLog(`❌ ${type} transport connect failed`, {
            message: e?.message,
          });
        }
      });

      transport.on('connectionstatechange', (state) => {
        pushLog(`ℹ️ ${type} transport connectionstatechange`, {
          state,
          dtlsState: transport.dtlsState,
        });
      });

      if (type === 'send') {
        transport.on(
          'produce',
          async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
              const payload = {
                transport_id: transport.id,
                kind,
                type: appData?.type || (kind === 'audio' ? 'mic' : 'cam'),
                rtpParameters,
              };

              pushLog('➡️ PRODUCE emit (ack)', {
                transport_id: payload.transport_id,
                kind: payload.kind,
                type: payload.type,
              });

              const res = await emitAck(socket, EV.PRODUCE, payload);
              pushLog('⬅️ PRODUCE ack', res);

              const producerInfo =
                res?.producerInfo || res?.producer_info || res;
              const producer_id =
                producerInfo?.producer_id || producerInfo?.producerId;
              if (!producer_id) throw new Error('producer_id missing in ack');

              callback({ id: producer_id });
              producedSetRef.current.add(producer_id); // 자기 자신 consume 방지에도 도움

              pushLog('✅ PRODUCE callback done', {
                producer_id,
                kind,
                type: payload.type,
              });
            } catch (e) {
              errback(e);
              pushLog('❌ PRODUCE failed', { message: e?.message });
            }
          },
        );
      }

      return transport;
    },
    [emitAck, pushLog, syncRoomMembersSafe],
  );

  const createSendAndRecvTransports = useCallback(async () => {
    try {
      await createTransport('send');
      await createTransport('recv');
    } catch (e) {
      pushLog('❌ create transports failed', { message: e?.message });
    }
  }, [createTransport, pushLog]);

  const startLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play().catch(() => {});
      }

      pushLog('✅ gotUserMedia ok', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });
    } catch (e) {
      pushLog('❌ getUserMedia failed', { message: e?.message });
    }
  }, [pushLog]);

  const produceLocal = useCallback(async () => {
    const transport = sendTransportRef.current;
    const device = deviceRef.current;
    const stream = localStreamRef.current;

    if (!device) return pushLog('⚠️ device not loaded');
    if (!transport) return pushLog('⚠️ sendTransport not ready');
    if (!stream)
      return pushLog('⚠️ local media not ready (getUserMedia first)');

    try {
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      if (audioTrack && device.canProduce('audio')) {
        const audioProducer = await transport.produce({
          track: audioTrack,
          appData: { type: 'mic' },
          codecOptions: { opusStereo: true, opusDtx: true },
        });
        pushLog('🎙️ local audio producer created', { id: audioProducer.id });
      }

      if (videoTrack && device.canProduce('video')) {
        const videoProducer = await transport.produce({
          track: videoTrack,
          appData: { type: 'cam' },
          encodings: [{ maxBitrate: 1_500_000 }],
          codecOptions: { videoGoogleStartBitrate: 1000 },
        });
        pushLog('📷 local video producer created', { id: videoProducer.id });
      }
    } catch (e) {
      pushLog('❌ produceLocal failed', { message: e?.message });
    }
  }, [pushLog]);

  const resumeAll = useCallback(async () => {
    const keys = Array.from(consumerIdRef.current.keys());
    if (keys.length === 0) return pushLog('ℹ️ no consumers to resume');
    for (const producer_id of keys) await resumeConsumer({ producer_id });
  }, [pushLog, resumeConsumer]);

  const disconnect = useCallback(() => {
    stopScreenShare();

    try {
      for (const c of consumersRef.current.values()) {
        try {
          c.close();
        } catch {}
      }
    } catch {}

    consumersRef.current.clear();
    consumerIdRef.current.clear();
    producedSetRef.current = new Set();

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const s = localStreamRef.current;
    if (s) s.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    deviceRef.current = null;
    sendTransportRef.current = null;
    recvTransportRef.current = null;

    setRemoteStreams([]);
    setMembers([]);
    memberMapRef.current.clear();

    setConnected(false);
    setJoined(false);
    pushLog('🧹 disconnected & cleared refs');
  }, [pushLog, stopScreenShare]);

  const status = useMemo(() => {
    return {
      connected,
      joined,
      deviceLoaded: !!deviceRef.current,
      sendTransport: sendTransportRef.current?.id || null,
      recvTransport: recvTransportRef.current?.id || null,
      sendDtls: sendTransportRef.current?.dtlsState || null,
      recvDtls: recvTransportRef.current?.dtlsState || null,
      remoteCount: remoteStreams.length,
      screenSharing,
      consumersCount: consumerIdRef.current.size,
      membersCount: members.length,
      roomIdUI: roomId,
    };
  }, [
    connected,
    joined,
    remoteStreams.length,
    screenSharing,
    roomId,
    members.length,
  ]);

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h2>SFU Signaling Test (+ room members)</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          maxWidth: 1200,
        }}
      >
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <label>Access Token (옵션): </label>
            <input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="게스트면 비워도 됨"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Room ID (UI only): </label>
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Nickname: </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Code (32 chars): </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={connectSocket}>1) Connect Socket</button>
            <button onClick={joinRoom} disabled={!connected}>
              2) Join Room
            </button>
            <button
              onClick={negotiateSdpAndLoadDevice}
              disabled={!connected || !joined}
            >
              3) SDP + Device.load
            </button>
            <button
              onClick={createSendAndRecvTransports}
              disabled={!connected || !joined || !deviceRef.current}
            >
              4) Create send/recv Transport
            </button>

            <button onClick={startLocalMedia} disabled={!connected || !joined}>
              5) getUserMedia
            </button>
            <button
              onClick={produceLocal}
              disabled={!sendTransportRef.current || !localStreamRef.current}
            >
              6) Produce (mic/cam)
            </button>

            <button
              onClick={startScreenShare}
              disabled={!sendTransportRef.current || screenSharing}
            >
              7) Start Screen Share
            </button>
            <button onClick={stopScreenShare} disabled={!screenSharing}>
              8) Stop Screen Share
            </button>

            <button onClick={resumeAll} disabled={!recvTransportRef.current}>
              Resume All Consumers
            </button>

            <button
              onClick={() =>
                syncRoomMembersSafe({
                  reason: 'manual_click',
                  autoConsume: false,
                })
              }
              disabled={!joined}
            >
              Sync Room Members
            </button>

            <button onClick={disconnect}>Disconnect</button>
          </div>

          <div
            style={{
              marginTop: 12,
              background: '#fafafa',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <div>
              <b>Status</b>
            </div>
            <pre style={{ margin: 0 }}>{JSON.stringify(status, null, 2)}</pre>
          </div>

          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div
              style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Local Preview
              </div>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', background: '#000', borderRadius: 8 }}
              />
            </div>

            <div
              style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Room Members
              </div>
              {members.length === 0 ? (
                <div style={{ fontSize: 12, color: '#666' }}>아직 없음</div>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  {members.map((m, idx) => {
                    const key =
                      m.socket_id || m.socketId || m.user_id || m.userId || idx;
                    return (
                      <div
                        key={key}
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <div style={{ fontSize: 12 }}>
                          nickname: <b>{m.nickname ?? '(empty)'}</b> / guest:{' '}
                          <b>{String(m.is_guest ?? m.isGuest ?? false)}</b>
                        </div>
                        <div
                          style={{ fontSize: 11, color: '#555', marginTop: 2 }}
                        >
                          socket_id: {m.socket_id || m.socketId || '-'} /
                          user_id: {m.user_id || m.userId || '-'}{' '}
                          {m.ip ? `/ ip: ${m.ip}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                gridColumn: '1 / -1',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 8,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Remote</div>

              {remoteStreams.length === 0 && (
                <div style={{ fontSize: 12, color: '#666' }}>아직 없음</div>
              )}

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {remoteStreams.map((r) => {
                  const isVideo = r.kind === 'video';
                  return (
                    <div
                      key={r.producer_id}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        padding: 8,
                      }}
                    >
                      <div
                        style={{ fontSize: 12, color: '#333', marginBottom: 6 }}
                      >
                        producer_id: <b>{r.producer_id}</b> / kind:{' '}
                        <b>{r.kind}</b> / type: <b>{r.type}</b> / status:{' '}
                        <b>{r.status}</b>
                        <button
                          style={{ marginLeft: 8 }}
                          onClick={() =>
                            attachRemote(r.producer_id, r.kind, r.stream)
                          }
                        >
                          Attach/Play
                        </button>
                        <button
                          style={{ marginLeft: 8 }}
                          onClick={() =>
                            resumeConsumer({ producer_id: r.producer_id })
                          }
                        >
                          Resume
                        </button>
                      </div>

                      {isVideo ? (
                        <video
                          ref={(el) => {
                            if (el) {
                              remoteVideoRefs.current.set(r.producer_id, el);
                              attachRemote(r.producer_id, 'video', r.stream);
                            }
                          }}
                          autoPlay
                          playsInline
                          style={{
                            width: '100%',
                            background: '#000',
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <audio
                          ref={(el) => {
                            if (el) {
                              remoteAudioRefs.current.set(r.producer_id, el);
                              attachRemote(r.producer_id, 'audio', r.stream);
                            }
                          }}
                          autoPlay
                          controls
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <div>
            <b>Logs (최신이 위)</b>
          </div>
          <div
            style={{
              height: 820,
              overflow: 'auto',
              marginTop: 8,
              background: '#111',
              color: '#0f0',
              padding: 8,
              borderRadius: 8,
            }}
          >
            {logs.map((l, idx) => (
              <div
                key={idx}
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
