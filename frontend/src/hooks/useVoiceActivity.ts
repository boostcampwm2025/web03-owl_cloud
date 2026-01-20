import { useEffect, useState } from 'react';

export function useVoiceActivity(
  audioTrack: MediaStreamTrack | null | undefined,
) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!audioTrack || audioTrack.readyState !== 'live') return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(
      new MediaStream([audioTrack]),
    );
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      // 감도 조절
      setIsSpeaking(average > 40);
      requestAnimationFrame(checkVolume);
    };

    checkVolume();
    return () => {
      audioContext.close();
    };
  }, [audioTrack]);

  return isSpeaking;
}
