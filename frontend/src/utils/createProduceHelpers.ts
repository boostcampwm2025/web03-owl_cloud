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
  const produceCam = (track: MediaStreamTrack, resume = false) => {
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

    // appData 부분에 메인화면에 경우 main을 붙혀서 성능을 높일 수
    return sendTransport.produce({
      track,
      appData: { type: 'cam', resume },
      // simulcast 방식 ( 아래로 갈수록 고화질 )
      encodings: [
        { rid: 'r0', scaleResolutionDownBy: 4, maxBitrate: 250_000 },
        { rid: 'r1', scaleResolutionDownBy: 2, maxBitrate: 700_000 },
        { rid: 'r2', scaleResolutionDownBy: 1, maxBitrate: 1_500_000 },
      ],
      codecOptions: {
        videoGoogleStartBitrate: 600,
      },
    });
  };

  // 가능하면 VP9 안되면 VP8로 전달
  const produceScreenVideo = (track: MediaStreamTrack) => {
    const vp9 = findVp9Codec();
    // vp9은 조건 부로 써보자
    if (vp9) {
      return sendTransport.produce({
        track,
        appData: { type: 'screen_video' },
        codec: vp9,
        encodings: [
          { maxBitrate: 5_000_000 }, // cam 보다는 더 높아야 한다. (상황에 따라서 SVC를 사용할 수 있게 해주면 좋다.) ( SVC는 좀 더 나중에 세밀한 조정때 유용하다. )
        ],
        codecOptions: { videoGoogleStartBitrate: 1200 },
      });
    } // vp9은 실험을 통해서 진행을 해야 한다.

    // vp9을 지원하지 않는 경우는 문서를 기준으로 정리해주는게
    return sendTransport.produce({
      track,
      appData: { type: 'screen_video' },
      encodings: [ // 화면 공유에 경우 vp8인 경우 이러한 타입으로 진행을 한다.
        { rid: "r0", scaleResolutionDownBy: 2, maxBitrate: 800_000 }, // 540p 
        { rid: "r1", scaleResolutionDownBy: 1, maxBitrate: 3_500_000 }, // 1080p
      ],
      codecOptions: {
        videoGoogleStartBitrate: 1200, // 화면공유에 시작 비트레이트는 낮게
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
