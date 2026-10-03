import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Mic,
  MicOff,
  Globe,
  CameraOff,
  ShieldAlert,
  ChevronDown,
  Monitor,
  Square,
  Sparkles,
  Dice5,
  Radio,
  Settings,
  ShieldCheck,
  Info
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { MingleoLogo } from './MingleoLogo';
import { SUPPORTED_LANGUAGES } from '../config/constants';
import { SupportedLanguage, ChatMessage } from '../types';
import { quickClientModeration } from '../utils/moderationEngine';

interface MingleoLiveRoomProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isSearching: boolean;
  isConnected: boolean;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  isScreenSharing: boolean;
  isRemoteScreenSharing: boolean;
  isScreenShareSupported: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onStartScreenShare: () => Promise<boolean>;
  onStopScreenShare: () => Promise<void>;
  onEndCall: () => void;
  onNext: () => void;
  onStartChat: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserId: string;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenReport?: () => void;
  onOpenSettings?: () => void;
  onOpenGuidelines?: () => void;
  onOpenAbout?: () => void;
  isSocketConnected?: boolean;
}

const ICEBREAKERS = [
  "If you could travel anywhere tomorrow, where would you go? ✈️",
  "What's your favorite song or genre of music right now? 🎵",
  "If you could have one superpower, what would you choose? ⚡",
  "What's the best movie or series you've watched recently? 🍿",
  "Are you a coffee or tea person, and why? ☕",
  "What is the most famous food or dish from your hometown? 🍲",
  "What hobby or skill are you currently learning? 🎨",
  "What's one thing that always makes you laugh? 😂",
];

export const MingleoLiveRoom: React.FC<MingleoLiveRoomProps> = ({
  localStream,
  remoteStream,
  screenStream,
  isSearching,
  isConnected,
  isAudioMuted,
  isVideoDisabled,
  isScreenSharing,
  isRemoteScreenSharing,
  isScreenShareSupported,
  onToggleCam,
  onToggleMic,
  onStartScreenShare,
  onStopScreenShare,
  onEndCall,
  onNext,
  onStartChat,
  messages,
  onSendMessage,
  currentUserId,
  selectedLanguage,
  onSelectLanguage,
  onOpenReport,
  onOpenSettings,
  onOpenGuidelines,
  onOpenAbout,
  isSocketConnected = true,
}) => {
  // Disconnect button state: 'idle' | 'really'
  const [disconnectStage, setDisconnectStage] = useState<'idle' | 'really'>('idle');
  const [inputText, setInputText] = useState<string>('');
  const [autoReroll, setAutoReroll] = useState<boolean>(false);
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);
  const [hasDisconnected, setHasDisconnected] = useState<boolean>(false);
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Auto-scroll chat log
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isConnected, isSearching, hasDisconnected]);

  // Track disconnection transitions
  useEffect(() => {
    if (isConnected) {
      setHasDisconnected(false);
      setDisconnectStage('idle');
    } else if (!isSearching && !isConnected) {
      setHasDisconnected(true);
      if (autoReroll) {
        const timer = setTimeout(() => {
          onNext();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isConnected, isSearching, autoReroll, onNext]);

  // Global Keyboard shortcuts: Esc for Stop/Really/New
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleOrangeButtonClick();
      } else if (e.key === 'm' || e.key === 'M') {
        onToggleMic();
      } else if (e.key === 'v' || e.key === 'V') {
        onToggleCam();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Handle click on the orange action button
  const handleOrangeButtonClick = () => {
    if (!isConnected && !isSearching) {
      setHasDisconnected(false);
      onNext();
    } else if (isSearching) {
      onEndCall();
    } else if (isConnected) {
      if (disconnectStage === 'idle') {
        setDisconnectStage('really');
      } else {
        setDisconnectStage('idle');
        onNext();
      }
    }
  };

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    onSelectLanguage(newLang);
    setIsLangOpen(false);
    if (isSearching) {
      onEndCall();
      setTimeout(() => {
        onStartChat();
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const check = quickClientModeration(val);
    if (!check.isClean) {
      setLocalWarning(`Flagged term detected ("${check.flaggedWord}"). Swearing is not allowed.`);
    } else {
      setLocalWarning(null);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText('');
    setLocalWarning(null);
    inputRef.current?.focus();
  };

  // Screen share button handler
  const handleScreenShareToggle = async () => {
    if (isScreenSharing) {
      await onStopScreenShare();
    } else {
      await onStartScreenShare();
    }
  };

  // Insert random icebreaker question
  const handleInsertIcebreaker = () => {
    const randomTopic = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
    setInputText(randomTopic);
    inputRef.current?.focus();
  };

  // Take Snapshot function with shutter flash effect
  const handleTakeSnapshot = () => {
    const videos = document.querySelectorAll('video');
    const targetVideo = (videos[0] as HTMLVideoElement) || (videos[1] as HTMLVideoElement);
    if (!targetVideo || !targetVideo.videoWidth) {
      alert('Camera feed is not ready for snapshot yet.');
      return;
    }

    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = targetVideo.videoWidth;
      canvas.height = targetVideo.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(targetVideo, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `mingleo-snapshot-${Date.now()}.png`;
        link.click();
      }
    } catch (err) {
      console.error('Failed to take snapshot:', err);
    }
  };

  // Compute text for Orange Button
  const orangeButtonText = !isConnected && !isSearching
    ? 'New Chat'
    : isSearching
    ? 'Stop Search'
    : disconnectStage === 'really'
    ? 'Really Disconnect?'
    : 'Stop';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Shutter flash animation overlay */}
      {isFlashActive && (
        <div className="fixed inset-0 z-50 bg-white opacity-80 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Ambient glowing radial backdrop */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none -z-10" />

      {/* Modern Top Header with Mingleo Branding & Language Selector */}
      <header className="w-full px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800/80 bg-[#0c1122]/90 backdrop-blur-md sticky top-0 z-40">
        {/* Left: Brand Logo & Status */}
        <div className="flex items-center gap-3">
          <MingleoLogo size="md" />
          <div
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-2 border-l border-slate-700/80 pl-3 cursor-pointer group"
            title="Click to manage server & audio/video settings"
          >
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-medium">
              {isSocketConnected ? `Strict ${currentLangObj.name} queue active` : 'Demo / Standalone mode'}
            </span>
          </div>
        </div>

        {/* Right: Language Selector Dropdown & Quick Modals */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Safety / Guidelines Button */}
          {onOpenGuidelines && (
            <button
              onClick={onOpenGuidelines}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#131b30] hover:bg-[#1a2542] border border-slate-700 hover:border-emerald-500/50 rounded-full text-xs font-semibold text-slate-300 shadow-sm transition-all"
              title="Community Safety Guidelines"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safety</span>
            </button>
          )}

          {/* About / Privacy Button */}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#131b30] hover:bg-[#1a2542] border border-slate-700 hover:border-blue-500/50 rounded-full text-xs font-semibold text-slate-300 shadow-sm transition-all"
              title="About Mingleo & Privacy"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>About</span>
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#131b30] hover:bg-[#1a2542] border border-slate-700 hover:border-cyan-500/60 rounded-full text-xs font-semibold text-slate-200 shadow-sm transition-all"
              title="Select Matchmaking Language"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentLangObj.name} ({currentLangObj.nativeName})</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#0e1628] border border-slate-700/90 rounded-2xl shadow-2xl py-2 z-50 max-h-72 overflow-y-auto text-left backdrop-blur-xl">
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800">
                  Strict Language Queues
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full px-3.5 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      selectedLanguage === lang.code ? 'font-bold text-cyan-300 bg-cyan-950/40' : 'text-slate-300'
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-[11px] text-slate-400">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#131b30] hover:bg-[#1a2542] border border-slate-700 hover:border-cyan-500/50 rounded-full text-xs font-semibold text-slate-300 shadow-sm transition-all flex items-center gap-1.5"
              title="Audio, Video & Safety Settings"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
        </div>
      </header>

      {/* Screen Sharing Active Banners */}
      {isScreenSharing && (
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-3 shadow-lg">
          <Monitor className="w-4 h-4 animate-pulse" />
          <span>You are sharing your screen with the stranger</span>
          <button
            onClick={onStopScreenShare}
            className="px-3 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop Sharing</span>
          </button>
        </div>
      )}

      {isRemoteScreenSharing && !isScreenSharing && (
        <div className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg">
          <Monitor className="w-4 h-4 animate-pulse text-cyan-300" />
          <span>Stranger is currently sharing their screen</span>
        </div>
      )}

      {/* Main Video & Chat Workspace */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col lg:flex-row gap-4 max-w-[1700px] w-full mx-auto">
        {/* ================= LEFT MAIN AREA: BIG VIDEO LENGTH & BOTTOM ACTION BAR ================= */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* 1. BIG VIDEO LAYOUT: Side-by-Side Dual Feeds for Maximum Length */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[420px] md:min-h-[520px] lg:min-h-[580px]">
            {/* Left Box: Stranger Feed (or Screen Share) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#050811] border border-slate-800 shadow-2xl flex items-center justify-center group aspect-[4/3] md:aspect-auto">
              {isConnected && remoteStream ? (
                <VideoPlayer
                  stream={remoteStream}
                  label=""
                  muteVideoElement={true}
                  className="w-full h-full object-cover"
                />
              ) : isSearching ? (
                <div className="text-center p-6 space-y-3">
                  <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-60" />
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base text-white font-bold">
                      {isSocketConnected
                        ? `Finding someone who speaks ${currentLangObj.name}...`
                        : `Connecting to demo ${currentLangObj.name} stranger...`}
                    </p>
                    <p className="text-xs text-cyan-300/80">
                      {isSocketConnected
                        ? 'Strict queue • Instant auto-connection'
                        : 'Standalone simulation • Configure backend in Settings'}
                    </p>
                  </div>
                  <button
                    onClick={onEndCall}
                    className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
                  >
                    Cancel Search
                  </button>
                </div>
              ) : (
                <div
                  onClick={onStartChat}
                  className="w-full h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-slate-900/60 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <p className="text-base font-bold text-white">Click to Connect with a Stranger</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Match exclusively with {currentLangObj.name} speakers worldwide
                  </p>
                </div>
              )}

              {/* Watermark at Bottom-Left: mingleo.com */}
              <div className="absolute bottom-3 left-3 pointer-events-none select-none z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-xs font-semibold tracking-tight text-white/90">
                  Stranger • mingleo<span className="text-cyan-400">.com</span>
                </span>
              </div>

              {/* Top-Right: Report/Block button */}
              {isConnected && (
                <button
                  onClick={onOpenReport}
                  className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-black/60 hover:bg-rose-900/80 border border-white/20 text-white text-[11px] font-semibold shadow-md transition-colors backdrop-blur-md"
                >
                  Report / Block
                </button>
              )}
            </div>

            {/* Right Box: You (Local Camera Preview or Shared Screen) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#050811] border border-slate-800 shadow-2xl flex items-center justify-center aspect-[4/3] md:aspect-auto">
              {isScreenSharing && screenStream ? (
                <div className="relative w-full h-full">
                  <VideoPlayer
                    stream={screenStream}
                    label="Your Shared Screen"
                    isLocal={true}
                    muteVideoElement={true}
                    className="w-full h-full object-contain bg-slate-950"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[11px] font-bold shadow-md backdrop-blur-md flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Your Shared Screen</span>
                  </div>
                </div>
              ) : localStream ? (
                <VideoPlayer
                  stream={localStream}
                  isLocal={true}
                  isMuted={isAudioMuted}
                  isVideoOff={isVideoDisabled}
                  isMirrored={true}
                  label=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  onClick={() => onToggleCam()}
                  className="w-full h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-slate-900/60 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-white">Enable Camera</p>
                  <p className="text-xs text-slate-400 mt-1">Local camera preview will show here</p>
                </div>
              )}

              {/* Watermark at Bottom-Left: You */}
              <div className="absolute bottom-3 left-3 pointer-events-none select-none z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${localStream && !isVideoDisabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="text-xs font-semibold tracking-tight text-white/90">
                  You {isAudioMuted && <span className="text-rose-400 font-normal ml-1">• Muted</span>}
                </span>
              </div>
            </div>
          </div>

          {/* 2. BOTTOM CONTROL BAR: ACTION BUTTON IS KEPT DOWN HERE! */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0c1222]/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
            {/* The Prominent Orange Action Button (Kept Down!) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOrangeButtonClick}
                className={`px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2.5 shadow-lg transition-all active:scale-95 cursor-pointer select-none ${
                  disconnectStage === 'really'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-600/30'
                    : isSearching
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-600/30'
                    : 'bg-gradient-to-r from-[#ff7a00] to-[#ff9e00] hover:from-[#ff8800] hover:to-[#ffa81a] text-white shadow-orange-500/25'
                }`}
                title="Press Esc on keyboard anytime"
              >
                <span>{orangeButtonText}</span>
                <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono font-bold text-white/90">
                  Esc
                </span>
              </button>
            </div>

            {/* Media Action Buttons: Mic, Cam, Screen Share, Snapshot, Icebreaker */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Mic Toggle Button (Fixed mute/unmute state with visual feedback) */}
              <button
                onClick={() => onToggleMic()}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                  isAudioMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30 shadow-sm'
                    : 'bg-[#131b30] hover:bg-[#1a2542] border-slate-700 text-slate-200'
                }`}
                title={isAudioMuted ? 'Click to Unmute Microphone (M)' : 'Click to Mute Microphone (M)'}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span className="hidden sm:inline">{isAudioMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* Cam Toggle Button */}
              <button
                onClick={() => onToggleCam()}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                  isVideoDisabled
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30 shadow-sm'
                    : 'bg-[#131b30] hover:bg-[#1a2542] border-slate-700 text-slate-200'
                }`}
                title={isVideoDisabled ? 'Click to Turn Camera On (V)' : 'Click to Turn Camera Off (V)'}
              >
                {isVideoDisabled ? <CameraOff className="w-4 h-4 text-rose-400" /> : <Camera className="w-4 h-4 text-cyan-400" />}
                <span className="hidden sm:inline">{isVideoDisabled ? 'Start Cam' : 'Stop Cam'}</span>
              </button>

              {/* Screen Share Button */}
              {isScreenShareSupported && (
                <button
                  onClick={handleScreenShareToggle}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                    isScreenSharing
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30'
                      : 'bg-[#131b30] hover:bg-[#1a2542] border-slate-700 text-slate-200'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen, Window or Tab'}
                >
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Screen Share'}</span>
                </button>
              )}

              {/* Take Snapshot Button */}
              <button
                onClick={handleTakeSnapshot}
                className="px-3 py-2 rounded-xl bg-[#131b30] hover:bg-[#1a2542] border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Save a snapshot of the conversation"
              >
                <Camera className="w-4 h-4 text-pink-400" />
                <span className="hidden md:inline">Snapshot</span>
              </button>

              {/* Icebreaker Topic Generator Button */}
              <button
                onClick={handleInsertIcebreaker}
                className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Insert a fun icebreaker question"
              >
                <Dice5 className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Icebreaker 🎲</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT AREA: REDUCED COMPACT CHAT (SMALL SPACE) ================= */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col bg-[#0c1222]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[440px] lg:min-h-0">
          {/* Compact Chat Header */}
          <div className="px-3.5 py-2.5 bg-[#0e1628] border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-bold text-slate-200">
                {isConnected ? 'Live Stranger Chat' : isSearching ? 'Searching...' : 'Mingleo Chat'}
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">
              {currentLangObj.name}
            </span>
          </div>

          {/* Chat Messages Scroll Container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-left font-sans text-xs leading-relaxed select-text">
            {/* System Greeting */}
            <div className="p-2.5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80 text-[11px] space-y-1 text-slate-400">
              <p className="font-semibold text-slate-200">
                You're now chatting with a random stranger!
              </p>
              <p>
                Strict matching in {currentLangObj.name}. Say hello or use the Break the Ice button below.
              </p>
            </div>

            {/* When Searching */}
            {isSearching && (
              <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center justify-between">
                <span>Looking for someone who speaks {currentLangObj.name}...</span>
                <button
                  onClick={onEndCall}
                  className="text-rose-400 hover:underline font-bold"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Message Stream with Modern Color-Coded Bubbles */}
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`px-3 py-1.5 rounded-2xl max-w-[90%] break-words text-xs font-medium shadow-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/60'
                    }`}
                  >
                    <span className="font-bold text-[10px] opacity-80 block mb-0.5">
                      {isMe ? 'You' : 'Stranger'}
                    </span>
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            })}

            {/* When Stranger Disconnects */}
            {hasDisconnected && !isSearching && (
              <div className="pt-2 space-y-2.5 text-center p-3 rounded-xl bg-[#0e1628] border border-slate-800">
                <p className="font-bold text-slate-300 text-xs">
                  Stranger has disconnected.
                </p>

                {/* Auto-reroll checkbox */}
                <label className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoReroll}
                    onChange={(e) => setAutoReroll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Auto-reconnect next time</span>
                </label>

                {/* Next Chat Button */}
                <button
                  onClick={() => {
                    setHasDisconnected(false);
                    onNext();
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Start New Chat
                </button>
              </div>
            )}

            <div ref={chatScrollRef} />
          </div>

          {/* Safety Warning Banner if restricted word detected */}
          {localWarning && (
            <div className="px-3 py-1.5 bg-rose-500/10 border-t border-rose-500/30 text-[11px] text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{localWarning}</span>
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={handleSend}
            className="border-t border-slate-800 p-2 bg-[#0a0f1d] flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type a message..."
              maxLength={300}
              className="flex-1 px-3 py-2 text-xs text-white placeholder-slate-500 bg-[#12192c] border border-slate-700/80 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </main>

      {/* Modern Compact Footer */}
      <footer className="py-2.5 px-4 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 bg-[#0c1122]/90">
        <div>
          <span>Mingleo • Strict language isolation matching in </span>
          <strong className="text-cyan-400">{currentLangObj.name}</strong>
        </div>
        <div className="flex items-center gap-3">
          <span>Peer-to-peer WebRTC</span>
          <span>•</span>
          <span>Screen Sharing</span>
          <span>•</span>
          <span>Press Esc anytime for next stranger</span>
        </div>
      </footer>
    </div>
  );
};
