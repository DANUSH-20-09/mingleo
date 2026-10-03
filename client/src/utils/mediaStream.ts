import { UserSettings } from '../types';
import { VIDEO_QUALITY_PRESETS } from '../config/constants';

export interface MediaErrorDiagnosis {
  type: 'permission_denied' | 'not_found' | 'device_in_use' | 'overconstrained' | 'insecure_context' | 'unknown';
  title: string;
  message: string;
  solution: string;
}

/**
 * Checks whether the current runtime environment supports getUserMedia
 */
export function checkMediaSupport(): { supported: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Window context is undefined.' };
  }

  // Check Secure Context (HTTPS or localhost is required for WebRTC getUserMedia)
  if (window.isSecureContext === false) {
    return {
      supported: false,
      error: 'Camera and microphone require a secure context (HTTPS or localhost).'
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: 'Your browser does not support WebRTC mediaDevices.getUserMedia. Please update your browser.'
    };
  }

  return { supported: true };
}

/**
 * Diagnoses getUserMedia errors into clear, actionable user guidance
 */
export function diagnoseMediaError(err: any): MediaErrorDiagnosis {
  const errName = err?.name || '';
  const errMsg = err?.message || '';

  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
    return {
      type: 'permission_denied',
      title: 'Camera / Microphone Permission Denied',
      message: 'Access to your camera or microphone was blocked by browser settings.',
      solution: 'Click the camera/lock icon in your browser address bar and choose "Allow", then reload the page.'
    };
  }

  if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    return {
      type: 'not_found',
      title: 'No Camera or Microphone Found',
      message: 'No active video or audio input hardware was detected on your system.',
      solution: 'Ensure your webcam and microphone or headset are securely plugged in and enabled.'
    };
  }

  if (errName === 'NotReadableError' || errName === 'TrackStartError') {
    return {
      type: 'device_in_use',
      title: 'Hardware In Use by Another Application',
      message: 'Your camera or microphone is currently being used by another application (Zoom, Teams, FaceTime, or another browser tab).',
      solution: 'Close other applications or tabs using your camera and try again.'
    };
  }

  if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
    return {
      type: 'overconstrained',
      title: 'Requested Video Resolution Not Supported',
      message: 'The selected camera cannot satisfy the requested resolution constraints.',
      solution: 'Switch to standard resolution (480p or 360p) in Settings.'
    };
  }

  if (errName === 'SecurityError') {
    return {
      type: 'insecure_context',
      title: 'Insecure Connection (HTTPS Required)',
      message: 'WebRTC camera and microphone access require HTTPS encryption.',
      solution: 'Ensure you are accessing the app over HTTPS or http://localhost.'
    };
  }

  return {
    type: 'unknown',
    title: 'Media Stream Error',
    message: errMsg || 'An unexpected error occurred while requesting device access.',
    solution: 'Please refresh the page and verify camera/mic permissions in browser settings.'
  };
}

/**
 * Requests camera and microphone streams with noise suppression, echo cancellation & fallbacks
 */
export async function requestUserMedia(
  settings: UserSettings,
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream> {
  const support = checkMediaSupport();
  if (!support.supported) {
    throw new Error(support.error || 'Media devices not supported.');
  }

  const quality = VIDEO_QUALITY_PRESETS[settings.videoQuality] || VIDEO_QUALITY_PRESETS['720p'];

  // 1. Primary constraint config
  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: quality.width, min: 320 },
    height: { ideal: quality.height, min: 240 },
    frameRate: { ideal: quality.frameRate, min: 15 },
  };

  if (settings.selectedCameraId) {
    videoConstraints.deviceId = { ideal: settings.selectedCameraId };
  } else if (facingMode) {
    videoConstraints.facingMode = { ideal: facingMode };
  }

  const baseAudioProcessing: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  const audioConstraints: MediaTrackConstraints = {
    ...baseAudioProcessing,
    echoCancellation: settings.echoCancellation ?? true,
    noiseSuppression: settings.noiseSuppression ?? true,
    autoGainControl: settings.autoGainControl ?? true,
  };

  if (settings.selectedMicrophoneId) {
    audioConstraints.deviceId = { ideal: settings.selectedMicrophoneId };
  }

  const verifyAndLogTrackSettings = (stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack && typeof audioTrack.getSettings === 'function') {
      const s = audioTrack.getSettings();
      console.log('[MediaStream] Active audio track settings:', {
        echoCancellation: s.echoCancellation,
        noiseSuppression: s.noiseSuppression,
        autoGainControl: s.autoGainControl,
        sampleRate: s.sampleRate,
        channelCount: s.channelCount,
      });
    }
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && typeof videoTrack.getSettings === 'function') {
      const vs = videoTrack.getSettings();
      console.log('[MediaStream] Active video track settings:', {
        width: vs.width,
        height: vs.height,
        frameRate: vs.frameRate,
        facingMode: vs.facingMode,
      });
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: audioConstraints
    });
    verifyAndLogTrackSettings(stream);
    return stream;
  } catch (initialErr: any) {
    console.warn('[MediaStream] Initial constraint request failed, trying relaxed fallback:', initialErr);

    // If permission was denied by user, do not retry - report permission error
    if (initialErr.name === 'NotAllowedError' || initialErr.name === 'PermissionDeniedError') {
      throw initialErr;
    }

    // 2. Relaxed fallback: standard video and audio with browser audio processing enabled
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: baseAudioProcessing
      });
      verifyAndLogTrackSettings(stream);
      return stream;
    } catch (basicErr: any) {
      console.warn('[MediaStream] Basic dual-track getUserMedia failed, attempting single-track fallback:', basicErr);

      if (basicErr.name === 'NotAllowedError' || basicErr.name === 'PermissionDeniedError') {
        throw basicErr;
      }

      // 3. Single-track fallback: if machine has no microphone or no webcam, try the one that exists
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        verifyAndLogTrackSettings(stream);
        return stream;
      } catch (videoOnlyErr) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: baseAudioProcessing });
          verifyAndLogTrackSettings(stream);
          return stream;
        } catch {
          throw initialErr;
        }
      }
    }
  }
}

/**
 * Enumerates all connected video and audio devices
 */
export async function getAvailableDevices(): Promise<{
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return { cameras: [], microphones: [], speakers: [] };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');
    const microphones = devices.filter(d => d.kind === 'audioinput');
    const speakers = devices.filter(d => d.kind === 'audiooutput');

    return { cameras, microphones, speakers };
  } catch (err) {
    console.error('[MediaStream] Error enumerating devices:', err);
    return { cameras: [], microphones: [], speakers: [] };
  }
}

/**
 * Releases all tracks on a MediaStream to turn off camera / mic hardware indicator lights
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach(track => {
    try {
      track.stop();
      console.log(`[MediaStream] Stopped track: ${track.kind} (${track.label})`);
    } catch (e) {
      console.warn('[MediaStream] Error stopping track:', e);
    }
  });
}

/**
 * Creates a synthetic animated media stream for Dev Simulation mode
 */
export function createSimulatedMediaStream(partnerName: string = 'Simulated Partner', language: string = 'Telugu'): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  let frame = 0;
  const particles: { x: number; y: number; size: number; speed: number; hue: number }[] = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 1.5 + 0.5,
      hue: Math.random() * 60 + 240 // Purple to Cyan
    });
  }

  function draw() {
    frame++;
    // Dark animated gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0b0d17');
    bgGrad.addColorStop(0.5, '#170f2c');
    bgGrad.addColorStop(1, '#08162b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floating particles
    particles.forEach(p => {
      p.y -= p.speed;
      if (p.y < 0) p.y = canvas.height;
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, 0.6)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Central pulsing avatar orb
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    const pulse = Math.sin(frame * 0.05) * 8;
    const radius = 65 + pulse;

    // Glowing outer ring
    const glowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius * 1.4);
    glowGrad.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
    glowGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.4)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Core circle
    const coreGrad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    coreGrad.addColorStop(0, '#8b5cf6');
    coreGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeBlink = Math.sin(frame * 0.03) > 0.95;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    if (eyeBlink) {
      ctx.beginPath();
      ctx.moveTo(centerX - 24, centerY - 10);
      ctx.lineTo(centerX - 12, centerY - 10);
      ctx.moveTo(centerX + 12, centerY - 10);
      ctx.lineTo(centerX + 24, centerY - 10);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - 18, centerY - 12, 5, 0, Math.PI * 2);
      ctx.arc(centerX + 18, centerY - 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smile
    ctx.beginPath();
    ctx.arc(centerX, centerY + 8, 16, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();

    // Soundwave bars below avatar
    const barCount = 7;
    const barWidth = 6;
    const spacing = 8;
    const startX = centerX - ((barCount * (barWidth + spacing)) / 2);
    for (let b = 0; b < barCount; b++) {
      const h = Math.abs(Math.sin(frame * 0.08 + b * 0.5)) * 26 + 6;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(startX + b * (barWidth + spacing), centerY + radius + 25 - (h / 2), barWidth, h);
    }

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(partnerName, centerX, canvas.height - 40);

    ctx.fillStyle = '#a855f7';
    ctx.font = '12px sans-serif';
    ctx.fillText(`[Simulated Partner • ${language.toUpperCase()}]`, centerX, canvas.height - 20);

    requestAnimationFrame(draw);
  }

  draw();

  const canvasStream = canvas.captureStream(30);

  // Add subtle synthetic audio tone
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const dest = audioCtx.createMediaStreamDestination();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      dest.stream.getAudioTracks().forEach(track => {
        track.enabled = true;
        canvasStream.addTrack(track);
      });
    }
  } catch {}

  return canvasStream;
}
