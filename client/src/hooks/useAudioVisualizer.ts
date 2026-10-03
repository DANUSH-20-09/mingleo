import { useEffect, useRef, useState } from 'react';

export function useAudioVisualizer(stream: MediaStream | null, isEnabled: boolean = true) {
  const [volume, setVolume] = useState<number>(0);
  const [frequencies, setFrequencies] = useState<number[]>([0, 0, 0, 0, 0]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!stream || !isEnabled) {
      setVolume(0);
      setFrequencies([0, 0, 0, 0, 0]);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setVolume(0);
      setFrequencies([0, 0, 0, 0, 0]);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      // In modern browsers, AudioContext starts suspended until user gesture
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const handleResume = () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      };
      window.addEventListener('click', handleResume, { once: true });
      window.addEventListener('keydown', handleResume, { once: true });

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let lastUpdateTime = 0;
      let lastVolume = 0;

      const updateMeter = (timestamp: number) => {
        if (!analyserRef.current) return;

        // Throttle updates to ~12 FPS (every 80ms) to ensure butter-smooth 60fps UI
        if (timestamp - lastUpdateTime >= 80) {
          analyserRef.current.getByteFrequencyData(dataArray);

          // Compute average volume level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));

          // Only trigger state update if volume changed significantly or dropped to zero
          if (Math.abs(normalizedVol - lastVolume) >= 3 || (normalizedVol === 0 && lastVolume !== 0)) {
            lastVolume = normalizedVol;
            setVolume(normalizedVol);

            // Sample 5 frequency bands for visualizers
            const step = Math.floor(dataArray.length / 5);
            const bands = [
              dataArray[0] || 0,
              dataArray[step] || 0,
              dataArray[step * 2] || 0,
              dataArray[step * 3] || 0,
              dataArray[step * 4] || 0
            ];
            setFrequencies(bands);
          }
          lastUpdateTime = timestamp;
        }

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animationFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (err) {
      console.debug('[AudioVisualizer] AudioContext init note:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stream, isEnabled]);

  return { volume, frequencies };
}
