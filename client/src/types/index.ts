export type SupportedLanguage =
  | 'telugu'
  | 'english'
  | 'hindi'
  | 'tamil'
  | 'kannada'
  | 'malayalam'
  | 'bengali'
  | 'marathi'
  | 'urdu'
  | 'spanish'
  | 'french'
  | 'german'
  | 'japanese'
  | 'arabic'
  | 'portuguese'
  | 'global';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  greeting: string;
  description: string;
}

export type ScreenState = 'landing' | 'setup' | 'diagnostics' | 'searching' | 'chat';

export type WebRTCConnectionStatus =
  | 'idle'
  | 'searching'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isFlagged?: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

export interface ModerationWarning {
  reason?: string;
  category?: string;
  detectedTerms?: string[];
  strikeCount: number;
  isBanned?: boolean;
  bannedUntil?: number;
}

export interface VideoQualityPreset {
  label: string;
  width: number;
  height: number;
  frameRate: number;
  idealBitrate: number;
}

export interface UserSettings {
  selectedCameraId: string;
  selectedMicrophoneId: string;
  selectedAudioOutputId: string;
  videoQuality: '720p' | '480p' | '360p';
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  mirrorSelfVideo: boolean;
  soundEffectsEnabled: boolean;
  speechSafetyConsent: boolean;
  themeAccent: 'purple' | 'cyan' | 'fuchsia';
}

export interface WebRTCDiagnostics {
  rttMs: number | null;
  packetLossPercent: number | null;
  audioBitrateKbps: number | null;
  videoBitrateKbps: number | null;
  videoResolution: string | null;
  fps: number | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'checking';
  localAudioTrackLive: boolean;
  localVideoTrackLive: boolean;
  remoteAudioTrackLive: boolean;
  remoteVideoTrackLive: boolean;
  iceConnectionState: RTCIceConnectionState | null;
  iceGatheringState: RTCIceGatheringState | null;
  signalingState: RTCSignalingState | null;
}
