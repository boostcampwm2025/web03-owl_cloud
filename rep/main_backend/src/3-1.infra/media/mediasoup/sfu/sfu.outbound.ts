import { Injectable, Logger } from "@nestjs/common";
import type { Router, WebRtcTransport } from "mediasoup/types";
import { listenIps } from "@infra/media/mediasoup/config";
import type { TransportFactoryPort } from "@app/sfu/ports";


@Injectable()
export class MediasoupTransportFactory implements TransportFactoryPort {
  private readonly logger = new Logger(MediasoupTransportFactory.name);

  async createWebRtcTransport(router: Router): Promise<WebRtcTransport> {

    // ip 설정을 해두고 
    const transport = await router.createWebRtcTransport({
      listenIps,
      enableUdp: true, // udp 허용
      enableTcp: true, // tcp 허용
      preferUdp: true, // udp가 최우선
      initialAvailableOutgoingBitrate: 1_000_000, // 첫 바이트는 이정도 
    });

    // 최대 전송율 정하기
    try {
      await transport.setMaxIncomingBitrate(1_500_000);
    } catch (e) {
      this.logger.warn(e); // 에러 메시지만 이유는 화면공유, 음성, 비디오등 다 다른데 하나로 고정할수는 없음 ( 상황에 따라서 나중에 개선해야 함 )
    }

    return transport;
  }

  attachDebugHooks(roomId: string, transport: WebRtcTransport) {
    transport.on("icestatechange", (state) => {
      this.logger.debug({ roomId, transportId: transport.id, state }, "ICE state changed");
    });
    transport.on("dtlsstatechange", (state) => {
      this.logger.debug({ roomId, transportId: transport.id, state }, "DTLS state changed");
    });
  }
}
