import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Mic,
  MicOff,
  VideoOff,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Volume2,
  ArrowRight,
  ChevronLeft,
  Settings2,
  FlipHorizontal,
  Activity,
  Info
} from 'lucide-react';
import { SupportedLanguage, UserSettings } from '../types';
import { SUPPORTED_LANGUAGES } from '../config/constants';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { useSafety } from '../context/SafetyContext';
import { useMediaStream } from '../context/MediaStreamContext';

interface PreChatSetupProps {
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  username: string;
  onUpdateUsername: (name: string) => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onStartSearch: () => void;
  onBackToHome: () => void;
  onOpenDiagnostics: () => void;
}

export const PreChatSetup: React.FC<PreChatSetupProps> = ({
  selectedLanguage,
  onSelectLanguage,
  username,
  onUpdateUsername,
  settings,
  onUpdateSettings,
  onStartSearch,
  onBackToHome,
  onOpenDiagnostics,
}) => {
  const { agreeToGuidelines } = useSafety();
  const {
    localStream,
    mediaState,
    errorDiagnosis,
    isAudioMuted,
    isVideoDisabled,
    facingMode,
    availableCameras,
    availableMicrophones,
    initializeMedia,
    toggleAudio,
    toggleVideo,
    flipCamera
  } = useMediaStream();

  // Consent checkboxes
  const [isAgeConfirmed, setIsAgeConfirmed] = useState<boolean>(true);
  const [isGuidelinesAgreed, setIsGuidelinesAgreed] = useState<boolean>(true);
  const [isSpeechModerationConsented, setIsSpeechModerationConsented] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { volume } = useAudioVisualizer(localStream, !isAudioMuted);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!localStream || mediaState === 'idle') {
      initializeMedia();
    }
  }, [initializeMedia, localStream, mediaState]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (!localStream || isVideoDisabled || mediaState !== 'ready') {
      videoEl.srcObject = null;
      return;
    }
    if (videoEl.srcObject !== localStream) {
      videoEl.srcObject = localStream;
    }
    videoEl.play().catch(err => {
      console.warn('[PreChatSetup] Local preview play notice:', err);
    });
  }, [localStream, isVideoDisabled, mediaState]);

  const handleStart = async () => {
    if (!isAgeConfirmed || !isGuidelinesAgreed) {
      alert('Please confirm age and agree to community safety guidelines before starting.');
      return;
    }

    // If stream not yet ready, try requesting one last time
    if (!localStream) {
      const stream = await initializeMedia();
      if (!stream) {
        alert('Please allow camera and microphone access before entering matchmaking.');
        return;
      }
    }

    agreeToGuidelines();
    onUpdateSettings({ speechSafetyConsent: isSpeechModerationConsented });
    onStartSearch();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white glass-button px-3 py-1.5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-cyan/15 hover:bg-brand-cyan/25 border border-brand-cyan/30 text-xs text-brand-cyan font-bold transition-all shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Hardware Diagnostics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Camera Preview & Mic Meter (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-glass relative overflow-hidden">
            {/* Live Video Preview Box */}
            <div className="relative aspect-video sm:aspect-[4/3] rounded-xl bg-dark-950 overflow-hidden border border-slate-800 flex items-center justify-center">
              {localStream && mediaState === 'ready' && !isVideoDisabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'video-mirrored' : ''}`}
                />
              ) : mediaState === 'requesting' ? (
                <div className="text-center space-y-3 p-6">
                  <div className="w-12 h-12 mx-auto rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" />
                  <p className="text-xs text-slate-300">Requesting Camera & Microphone Access...</p>
                </div>
              ) : mediaState === 'error' && errorDiagnosis ? (
                <div className="text-center space-y-3 p-6 max-w-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">{errorDiagnosis.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{errorDiagnosis.message}</p>
                  <button
                    onClick={() => initializeMedia()}
                    className="px-4 py-2 rounded-lg bg-brand-purple text-xs font-bold text-white hover:bg-brand-purple/80 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Permission Request
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <VideoOff className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Camera preview is paused or off</p>
                </div>
              )}

              {/* Status Pill on top of Video */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-dark-950/80 backdrop-blur border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${mediaState === 'ready' && !isVideoDisabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {mediaState === 'ready' && !isVideoDisabled ? 'Camera Live' : 'Camera Off'}
                </span>
              </div>

              {/* Toggle Preview Controls */}
              {mediaState === 'ready' && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAudio()}
                      className={`p-2 rounded-xl backdrop-blur text-xs font-medium border transition-colors ${
                        isAudioMuted
                          ? 'bg-rose-500/80 text-white border-rose-400'
                          : 'bg-dark-900/80 text-slate-200 border-slate-700 hover:bg-dark-800'
                      }`}
                      title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                      {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => toggleVideo()}
                      className={`p-2 rounded-xl backdrop-blur text-xs font-medium border transition-colors ${
                        isVideoDisabled
                          ? 'bg-rose-500/80 text-white border-rose-400'
                          : 'bg-dark-900/80 text-slate-200 border-slate-700 hover:bg-dark-800'
                      }`}
                      title={isVideoDisabled ? 'Turn on camera' : 'Turn off camera'}
                    >
                      {isVideoDisabled ? <VideoOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={flipCamera}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-dark-900/80 backdrop-blur border border-slate-700 text-[11px] text-slate-300 hover:text-white"
                    title="Switch Front/Rear Camera"
                  >
                    <FlipHorizontal className="w-3 h-3" />
                    <span>Flip ({facingMode === 'user' ? 'Front' : 'Rear'})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Microphone Volume Test Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-brand-cyan" />
                  Microphone Test Level
                </span>
                <span className="font-mono text-[11px] text-slate-300">{volume}%</span>
              </div>
              <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className="h-full bg-gradient-to-r from-brand-cyan via-brand-purple to-emerald-400 transition-all duration-100 rounded-full"
                  style={{ width: `${Math.min(100, volume * 1.4)}%` }}
                />
              </div>
              {volume > 15 && (
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Audio signal detected! Microphone is active.
                </p>
              )}
            </div>
          </div>

          {/* Device Selection Pickers */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-brand-purple" />
              Audio & Video Device Selection
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Camera Picker */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-slate-500" /> Camera Device
                </label>
                <select
                  value={settings.selectedCameraId}
                  onChange={(e) => {
                    onUpdateSettings({ selectedCameraId: e.target.value });
                    setTimeout(() => initializeMedia(), 100);
                  }}
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
                >
                  {availableCameras.length > 0 ? (
                    availableCameras.map(cam => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${cam.deviceId.slice(0, 5)}...`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default System Camera</option>
                  )}
                </select>
              </div>

              {/* Microphone Picker */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-slate-500" /> Microphone Device
                </label>
                <select
                  value={settings.selectedMicrophoneId}
                  onChange={(e) => {
                    onUpdateSettings({ selectedMicrophoneId: e.target.value });
                    setTimeout(() => initializeMedia(), 100);
                  }}
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
                >
                  {availableMicrophones.length > 0 ? (
                    availableMicrophones.map(mic => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default System Microphone</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Help notice if error */}
          {errorDiagnosis && (
            <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
              <span>{errorDiagnosis.solution}</span>
            </div>
          )}
        </div>

        {/* Right: Strict Match Configuration & Safety Consent (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Language Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Matchmaking Queue
              </span>
              <span className="text-[11px] font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/20">
                Strict Matching
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentLangObj.flag}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{currentLangObj.name} ({currentLangObj.nativeName})</h4>
                  <p className="text-[11px] text-slate-400">{currentLangObj.description}</p>
                </div>
              </div>
            </div>

            {/* Language Quick Dropdown */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Change Matchmaking Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
                className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-cyan font-medium"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.nativeName}) - Strict Match
                  </option>
                ))}
              </select>
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Your Anonymous Display Name:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => onUpdateUsername(e.target.value)}
                maxLength={20}
                placeholder="e.g. FriendlyViber"
                className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Safety & Consent Checklist */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Safety & Community Consent
            </h4>

            <div className="space-y-2.5 text-xs text-slate-300">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAgeConfirmed}
                  onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-brand-purple focus:ring-brand-purple bg-dark-900"
                />
                <span>I confirm that I am at least <strong>18 years old</strong>.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGuidelinesAgreed}
                  onChange={(e) => setIsGuidelinesAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-brand-purple focus:ring-brand-purple bg-dark-900"
                />
                <span>I agree to follow <strong>Community Guidelines</strong> (No nudity, harassment, or abusive language).</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSpeechModerationConsented}
                  onChange={(e) => setIsSpeechModerationConsented(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-brand-cyan focus:ring-brand-cyan bg-dark-900"
                />
                <span className="text-[11px] text-slate-400">
                  Allow temporary multilingual speech safety moderation (helps prevent abusive behavior, zero audio saved).
                </span>
              </label>
            </div>
          </div>

          {/* Start Matching Action */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!isAgeConfirmed || !isGuidelinesAgreed}
            className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-glow-purple transition-all duration-300 ${
              isAgeConfirmed && isGuidelinesAgreed
                ? 'bg-gradient-to-r from-brand-purple via-indigo-600 to-brand-cyan text-white hover:shadow-glow-cyan'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Start Searching for {currentLangObj.name} Speakers</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
