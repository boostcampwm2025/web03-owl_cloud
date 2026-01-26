import { useEffect, useRef, useState } from 'react';

export function useVoiceActivity(
  stream: MediaStream | null | undefined,
  options = { threshold: 10, hangoverMs: 400 },
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      if (average > options.threshold) {
        setIsSpeaking(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            setIsSpeaking(false);
            timeoutRef.current = null;
          }, options.hangoverMs);
        }
      }

      animationId = requestAnimationFrame(checkVolume);
    };

    checkVolume();

    return () => {
      cancelAnimationFrame(animationId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      audioContext.close();
    };
  }, [stream, options.threshold, options.hangoverMs]);

  return isSpeaking;
}
