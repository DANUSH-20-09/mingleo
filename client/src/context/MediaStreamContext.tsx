import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserSettings } from '../types';
import { requestUserMedia, stopMediaStream, getAvailableDevices, diagnoseMediaError, MediaErrorDiagnosis } from '../utils/mediaStream';

interface MediaStreamContextType {
  localStream: MediaStream | null;
  mediaState: 'idle' | 'requesting' | 'ready' | 'error';
  errorDiagnosis: MediaErrorDiagnosis | null;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  facingMode: 'user' | 'environment';
  availableCameras: MediaDeviceInfo[];
  availableMicrophones: MediaDeviceInfo[];
  availableSpeakers: MediaDeviceInfo[];
  initializeMedia: (overrideFacingMode?: 'user' | 'environment') => Promise<MediaStream | null>;
  stopMedia: () => void;
  toggleAudio: (forceState?: boolean) => void;
  toggleVideo: (forceState?: boolean) => void;
  flipCamera: () => Promise<void>;
  refreshDevices: () => Promise<void>;
}

const MediaStreamContext = createContext<MediaStreamContextType | null>(null);

export const MediaStreamProvider: React.FC<{
  children: React.ReactNode;
  settings: UserSettings;
}> = ({ children, settings }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaState, setMediaState] = useState<'idle' | 'requesting' | 'ready' | 'error'>('idle');
  const [errorDiagnosis, setErrorDiagnosis] = useState<MediaErrorDiagnosis | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<MediaDeviceInfo[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);

  const refreshDevices = useCallback(async () => {
    const devices = await getAvailableDevices();
    setAvailableCameras(devices.cameras);
    setAvailableMicrophones(devices.microphones);
    setAvailableSpeakers(devices.speakers);
  }, []);

  const stopMedia = useCallback(() => {
    if (localStreamRef.current) {
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setMediaState('idle');
    setErrorDiagnosis(null);
  }, []);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const initializeMedia = useCallback(async (overrideFacingMode?: 'user' | 'environment'): Promise<MediaStream | null> => {
    setMediaState('requesting');
    setErrorDiagnosis(null);

    const targetFacing = overrideFacingMode || facingMode;

    try {
      // If an existing stream is already active, stop it cleanly first
      if (localStreamRef.current) {
        stopMediaStream(localStreamRef.current);
        localStreamRef.current = null;
      }

      const stream = await requestUserMedia(settingsRef.current, targetFacing);
      // Guarantee audio tracks are unmuted and active on acquisition
      stream.getAudioTracks().forEach(t => {
        t.enabled = true;
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaState('ready');
      setIsAudioMuted(false);
      setIsVideoDisabled(false);

      await refreshDevices();
      return stream;
    } catch (err: any) {
      console.error('[MediaStreamContext] getUserMedia failed:', err);
      const diagnosis = diagnoseMediaError(err);
      setErrorDiagnosis(diagnosis);
      setMediaState('error');
      return null;
    }
  }, [facingMode, refreshDevices]);

  // Toggle Audio
  const toggleAudio = useCallback((forceState?: boolean) => {
    setIsAudioMuted(prevMuted => {
      const nextMuted = (typeof forceState === 'boolean') ? forceState : !prevMuted;
      const nextEnabled = !nextMuted;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = nextEnabled; });
      }
      return nextMuted;
    });
  }, []);

  // Toggle Video
  const toggleVideo = useCallback((forceState?: boolean) => {
    setIsVideoDisabled(prevDisabled => {
      const nextDisabled = (typeof forceState === 'boolean') ? forceState : !prevDisabled;
      const nextEnabled = !nextDisabled;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = nextEnabled; });
      }
      return nextDisabled;
    });
  }, []);

  // Flip Camera (Front / Rear)
  const flipCamera = useCallback(async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    await initializeMedia(nextFacing);
  }, [facingMode, initializeMedia]);

  // Listen for device changes (e.g. plugging in or unplugging USB headset/webcam)
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      const handleDeviceChange = () => {
        console.log('[MediaStreamContext] Device change detected, refreshing list...');
        refreshDevices();
      };
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [refreshDevices]);

  return (
    <MediaStreamContext.Provider
      value={{
        localStream,
        mediaState,
        errorDiagnosis,
        isAudioMuted,
        isVideoDisabled,
        facingMode,
        availableCameras,
        availableMicrophones,
        availableSpeakers,
        initializeMedia,
        stopMedia,
        toggleAudio,
        toggleVideo,
        flipCamera,
        refreshDevices
      }}
    >
      {children}
    </MediaStreamContext.Provider>
  );
};

export const useMediaStream = () => {
  const context = useContext(MediaStreamContext);
  if (!context) {
    throw new Error('useMediaStream must be used within a MediaStreamProvider');
  }
  return context;
};
