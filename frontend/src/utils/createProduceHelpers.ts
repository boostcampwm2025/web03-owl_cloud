import { Device, Transport } from 'mediasoup-client/types';

// track을 produce하는 헬퍼 함수들을 반환합니다. ( vp9을 사용하기 위해서 매개변수 하나를 추가 )
export function createProduceHelper(sendTransport: Transport, device: Device) {
  // vpc 9을 사용할 수 있는지 확인이 필요하다. ( vpc9을 사용할 수 있는지 확인하는 로직 )
  const findVp9Codec = () =>
    device.rtpCapabilities.codecs?.find(
      (c) => c.kind === 'video' && c.mimeType.toLowerCase() === 'video/vp9',
    );

  // 2) 실제 track produce 함수들
  const produceMic = (track: MediaStreamTrack) =>
    sendTransport.produce({
      track,
      appData: { type: 'mic' },
    });

  // 웹캠 같이 움직임이 많은 경우 VP8이 오히려 좋을 수 있다. ( vp9은 따로 추가 조건이 있을때 사용하면 좋을예정 )
  const produceCam = (track: MediaStreamTrack) => {
    // VP9이 가능한지 체크
    // const vp9 = findVp9Codec();

    // if (vp9) {
    //   return sendTransport.produce({
    //     track,
    //     appData: { type: 'cam' },
    //     codec: vp9,
    //     encodings: [
    //       { scalabilityMode: 'L3T3_KEY', maxBitrate: 1_200_000 }, // 3레이어 사용
    //     ],
    //     codecOptions: { videoGoogleStartBitrate: 600 },
    //   });
    // }

    return sendTransport.produce({
      track,
      appData: { type: 'cam' },
      // simulcast 방식 ( 아래로 갈수록 고화질 )
      encodings: [
        { rid: 'r0', scaleResolutionDownBy: 4, maxBitrate: 150_000 },
        { rid: 'r1', scaleResolutionDownBy: 2, maxBitrate: 500_000 },
        { rid: 'r2', scaleResolutionDownBy: 1, maxBitrate: 1_200_000 },
      ],
      codecOptions: {
        videoGoogleStartBitrate: 600,
      },
    });
  };

  // 가능하면 VP9 안되면 VP8로 전달
  const produceScreenVideo = (track: MediaStreamTrack) => {
    const vp9 = findVp9Codec();

    if (vp9) {
      return sendTransport.produce({
        track,
        appData: { type: 'screen_video' },
        codec: vp9,
        encodings: [
          { maxBitrate: 1_800_000 }, // cam 보다는 더 높아야 한다. (상황에 따라서 SVC를 사용할 수 있게 해주면 좋다.) ( SVC는 좀 더 나중에 세밀한 조정때 유용하다. )
        ],
        codecOptions: { videoGoogleStartBitrate: 400 },
      });
    }

    return sendTransport.produce({
      track,
      appData: { type: 'screen_video' },
      encodings: [
        {
          maxBitrate: 1_500_000, // codec이 safari 같은 경우 VP9이 오류가 많아서 VP8로 하고 가장 높은 화질 하나의 레이어로 처리 ( 가장 좋은건 화면 공유는 VP9으로 진행한다. )
        },
      ],
      codecOptions: {
        videoGoogleStartBitrate: 400, // 화면공유에 시작 비트레이트는 낮게
      },
    });
  };

  const produceScreenAudio = (track: MediaStreamTrack) =>
    sendTransport.produce({
      track,
      appData: { type: 'screen_audio' },
    });

  return {
    produceMic,
    produceCam,
    produceScreenVideo,
    produceScreenAudio,
  };
}
