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

  const quality = VIDEO_QUALITY_PRESETS[settings.videoQuality] || VIDEO_QUALITY_PRESETS['480p'];

  // 1. Primary constraint config: use IDEAL constraints only (never rigid min/max that cause OverconstrainedError or NotFoundError)
  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: quality.width },
    height: { ideal: quality.height },
    frameRate: { ideal: quality.frameRate },
  };

  if (settings.selectedCameraId) {
    videoConstraints.deviceId = { ideal: settings.selectedCameraId };
  } else if (facingMode) {
    videoConstraints.facingMode = { ideal: facingMode };
  }

  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: settings.echoCancellation ?? true,
    noiseSuppression: settings.noiseSuppression ?? true,
    autoGainControl: settings.autoGainControl ?? true,
  };

  if (settings.selectedMicrophoneId) {
    audioConstraints.deviceId = { ideal: settings.selectedMicrophoneId };
  }

  // Attempt 1: Configured ideal constraints
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: audioConstraints
    });
    return stream;
  } catch (initialErr: any) {
    console.warn('[MediaStream] Initial constraint request failed, trying relaxed fallback:', initialErr);

    if (initialErr.name === 'NotAllowedError' || initialErr.name === 'PermissionDeniedError') {
      throw initialErr;
    }

    // Attempt 2: Relaxed dual-track without specific device IDs or resolutions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: true
      });
      return stream;
    } catch (dualErr: any) {
      console.warn('[MediaStream] Relaxed dual-track failed, trying basic video & audio:', dualErr);

      if (dualErr.name === 'NotAllowedError' || dualErr.name === 'PermissionDeniedError') {
        throw dualErr;
      }

      // Attempt 3: Pure boolean constraints (works on all mobile webviews & laptops)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        return stream;
      } catch (boolErr: any) {
        if (boolErr.name === 'NotAllowedError' || boolErr.name === 'PermissionDeniedError') {
          throw boolErr;
        }

        // Attempt 4: Single track fallback (camera without microphone, or microphone without camera)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          return stream;
        } catch {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            return stream;
          } catch {
            throw initialErr;
          }
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
