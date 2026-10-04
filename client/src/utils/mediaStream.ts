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
export function createSimulatedMediaStream(_partnerName: string = 'Simulated Partner', _language: string = 'Telugu'): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  let frame = 0;
  // Dynamic constellation particle field
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
  }
  const particles: Particle[] = [];
  const palette = ['#06b6d4', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 2.5 + 1,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }

  function draw() {
    frame++;
    // 1. Deep space background with subtle radial glow
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bgRadial = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 40, canvas.width / 2, canvas.height / 2, 320);
    bgRadial.addColorStop(0, 'rgba(30, 27, 75, 0.45)');
    bgRadial.addColorStop(0.6, 'rgba(15, 23, 42, 0.6)');
    bgRadial.addColorStop(1, 'rgba(7, 11, 20, 0.95)');
    ctx.fillStyle = bgRadial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Constellation particles & laser lines
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw connecting laser filaments
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 75) {
          const alpha = (1 - dist / 75) * 0.25;
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 15;

    // 3. Expanding sonar energy rings
    for (let r = 1; r <= 3; r++) {
      const ringPulse = ((frame * 1.2 + r * 50) % 150);
      const ringRadius = 60 + ringPulse;
      const ringAlpha = Math.max(0, 1 - ringPulse / 150) * 0.35;
      ctx.strokeStyle = r % 2 === 0 ? `rgba(6, 182, 212, ${ringAlpha})` : `rgba(168, 85, 247, ${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Central Holographic Avatar Orb
    const corePulse = Math.sin(frame * 0.06) * 5;
    const radius = 62 + corePulse;

    // Outer glow aura
    const glowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius * 1.5);
    glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
    glowGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Orb body
    const bodyGrad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    bodyGrad.addColorStop(0, '#06b6d4');
    bodyGrad.addColorStop(0.5, '#6366f1');
    bodyGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Sleek inner border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. High-Tech Cyber Visor / Eyes
    const scanOffset = Math.sin(frame * 0.08) * 12;
    // Visor back plate
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(centerX - 32, centerY - 14, 64, 18, 9);
    ctx.fill();

    // Laser visor glow
    const laserGrad = ctx.createLinearGradient(centerX - 30, centerY, centerX + 30, centerY);
    laserGrad.addColorStop(0, '#38bdf8');
    laserGrad.addColorStop(0.5, '#ffffff');
    laserGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = laserGrad;
    ctx.beginPath();
    ctx.roundRect(centerX - 24 + scanOffset * 0.5, centerY - 8, 20, 6, 3);
    ctx.fill();

    // 6. Responsive Waveform Mouth / Audio visualizer
    const isSpeaking = Math.sin(frame * 0.1) > -0.2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isSpeaking) {
      const openH = Math.abs(Math.sin(frame * 0.15)) * 10 + 4;
      ctx.ellipse(centerX, centerY + 20, 14, openH, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.arc(centerX, centerY + 18, 14, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();
    }

    // 7. Dynamic Audio Equalizer Bars
    const barCount = 11;
    const barWidth = 4;
    const barSpacing = 7;
    const startX = centerX - ((barCount * (barWidth + barSpacing)) / 2);
    for (let b = 0; b < barCount; b++) {
      const distFromCenter = Math.abs(b - Math.floor(barCount / 2));
      const mult = 1 - (distFromCenter / barCount) * 0.4;
      const h = Math.abs(Math.sin(frame * 0.12 + b * 0.6)) * 26 * mult + 6;
      const barGrad = ctx.createLinearGradient(0, centerY + radius + 15, 0, centerY + radius + 15 + h);
      barGrad.addColorStop(0, '#06b6d4');
      barGrad.addColorStop(1, '#a855f7');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(startX + b * (barWidth + barSpacing), centerY + radius + 25 - (h / 2), barWidth, h, 2);
      ctx.fill();
    }

    // 8. Cyber HUD Elements (Corner frames & status)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(25, 40);
    ctx.lineTo(25, 25);
    ctx.lineTo(40, 25);
    ctx.stroke();
    // Top-right bracket
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40, 25);
    ctx.lineTo(canvas.width - 25, 25);
    ctx.lineTo(canvas.width - 25, 40);
    ctx.stroke();

    // Top-center HUD status pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.roundRect(centerX - 65, 20, 130, 22, 11);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(centerX - 45, 31, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AI SIMULATION', centerX + 8, 35);

    // Note: Canvas bottom area is deliberately left empty of text so DOM watermarks render cleanly!

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
