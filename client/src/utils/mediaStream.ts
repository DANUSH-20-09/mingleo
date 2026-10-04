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
