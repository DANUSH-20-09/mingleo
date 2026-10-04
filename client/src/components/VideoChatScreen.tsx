import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SkipForward,
  PhoneOff,
  MessageSquare,
  ShieldAlert,
  UserX,
  Settings,
  Maximize2,
  Minimize2,
  Monitor,
  Square,
  AlertTriangle,
  X,
  Lock,
  Volume2,
  VolumeX,
  Activity,
  Radio
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { TextChatOverlay } from './TextChatOverlay';
import { ReactionBursts } from './ReactionBursts';
import { ReportModal } from './ReportModal';
import { BlockModal } from './BlockModal';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { SUPPORTED_LANGUAGES, QUICK_EMOJIS } from '../config/constants';
import { SupportedLanguage, UserSettings } from '../types';

interface VideoChatScreenProps {
  localStream: MediaStream | null;
  selectedLanguage: SupportedLanguage;
  settings: UserSettings;
  onOpenSettings: () => void;
  onExitToSetup: () => void;
}

export const VideoChatScreen: React.FC<VideoChatScreenProps> = ({
  localStream,
  selectedLanguage,
  settings,
  onOpenSettings,
  onExitToSetup,
}) => {
  const {
    socket,
    matchData,
    nextMatch,
    endCall,
    messages,
    sendMessage,
    sendReaction,
    lastReaction,
    reportCurrentPartner,
    blockCurrentPartner,
  } = useSocket();

  const {
    remoteStream,
    screenStream,
    connectionStatus,
    isAudioMuted,
    isVideoDisabled,
    isRemoteAudioMuted,
    isRemoteVideoDisabled,
    isScreenSharing,
    isRemoteScreenSharing,
    isScreenShareSupported,
    diagnostics,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC({
    socket,
    localStream,
    matchData,
  });

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isBlockOpen, setIsBlockOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showScreenSharePrompt, setShowScreenSharePrompt] = useState<boolean>(false);
  const [isAudioAutoplayBlocked, setIsAudioAutoplayBlocked] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Dedicated Remote Audio Management: ensures audio stream is always played without depending on video element mounting
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;

    if (!remoteStream) {
      audioEl.srcObject = null;
      setIsAudioAutoplayBlocked(false);
      return;
    }

    const audioTracks = remoteStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = true;
    });

    if (audioEl.srcObject !== remoteStream) {
      audioEl.srcObject = remoteStream;
    }
    audioEl.muted = false;
    audioEl.volume = 1.0;

    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsAudioAutoplayBlocked(false);
        })
        .catch(err => {
          console.warn('[VideoChatScreen] Remote audio autoplay blocked by browser policy:', err);
          setIsAudioAutoplayBlocked(true);
        });
    }
  }, [remoteStream]);

  const handleUnblockAudio = () => {
    const audioEl = remoteAudioRef.current;
    if (audioEl) {
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioEl.play()
        .then(() => {
          setIsAudioAutoplayBlocked(false);
          console.log('[VideoChatScreen] Remote audio unblocked by user tap');
        })
        .catch(err => {
          console.error('[VideoChatScreen] Audio unblock attempt failed:', err);
        });
    }
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Global Keyboard shortcuts: Space or Esc for Next match
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleNextMatch();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleAudio();
      } else if (e.key === 'v' || e.key === 'V') {
        toggleVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAudio, toggleVideo]);

  const handleNextMatch = () => {
    if (isScreenSharing) {
      stopScreenShare();
    }
    nextMatch(true);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleEndSession = () => {
    if (isScreenSharing) {
      stopScreenShare();
    }
    endCall();
    onExitToSetup();
  };

  const handleShareScreenClick = () => {
    if (!isScreenShareSupported) {
      alert('Screen sharing is not supported on this browser or mobile device. Please use a desktop browser (Chrome, Edge, Firefox, Safari).');
      return;
    }

    if (isScreenSharing) {
      stopScreenShare();
    } else {
      // Show quick privacy reminder before prompt
      setShowScreenSharePrompt(true);
    }
  };

  const handleConfirmStartScreenShare = async () => {
    setShowScreenSharePrompt(false);
    await startScreenShare();
  };

  const unreadMessagesCount = messages.length;

  return (
    <div className="relative w-full h-[calc(100vh-65px)] flex flex-col justify-between bg-dark-950 overflow-hidden select-none">
      {/* Floating Reaction Bursts */}
      <ReactionBursts reaction={lastReaction} />

      {/* Persistent Screen Sharing Indicator Banners */}
      {isScreenSharing && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-brand-cyan/20 border border-brand-cyan text-brand-cyan text-xs font-bold flex items-center gap-2 shadow-glow-cyan backdrop-blur-md">
          <Monitor className="w-3.5 h-3.5 animate-pulse" />
          <span>You are sharing your screen</span>
          <button
            onClick={stopScreenShare}
            className="ml-2 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {isRemoteScreenSharing && !isScreenSharing && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-brand-purple/30 border border-brand-purple text-brand-purple text-xs font-bold flex items-center gap-2 shadow-glow-purple backdrop-blur-md">
          <Monitor className="w-3.5 h-3.5 animate-pulse" />
          <span>Stranger is sharing their screen</span>
        </div>
      )}

      {/* Dedicated Hidden Remote Audio Element (Never affected by video layout/mounting) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="hidden"
      />

      {/* Floating Audio Autoplay Unblock Banner */}
      {isAudioAutoplayBlocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-dark-900/95 border border-brand-cyan/70 shadow-glow-cyan backdrop-blur-xl flex items-center gap-3 animate-bounce select-none">
          <VolumeX className="w-5 h-5 text-brand-cyan" />
          <div className="text-left text-xs">
            <p className="font-bold text-white">Browser Blocked Audio Autoplay</p>
            <p className="text-[11px] text-slate-300">Tap below to hear the stranger speak</p>
          </div>
          <button
            onClick={handleUnblockAudio}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-bold shadow-md hover:opacity-90 flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Enable Audio</span>
          </button>
        </div>
      )}

      {/* Top Header Floating Status Pill Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Language & Match Details */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="glass-panel px-3.5 py-1.5 rounded-full border border-brand-purple/40 flex items-center gap-2 text-xs text-white shadow-glass">
            <span className="text-base">{currentLangObj.flag}</span>
            <span className="font-bold">{currentLangObj.name} ({currentLangObj.nativeName})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
          </div>

          <div className="glass-panel px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300 hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">Stranger:</span>
            <span className="font-semibold text-white">{matchData?.peerName || 'Connecting...'}</span>
          </div>
        </div>

        {/* Right: Connection State & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur flex items-center gap-1.5 shadow-md ${
              connectionStatus === 'connected'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                : connectionStatus === 'connecting'
                ? 'bg-cyan-950/80 border-brand-cyan/50 text-brand-cyan animate-pulse'
                : connectionStatus === 'reconnecting'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-400 animate-pulse'
                : 'bg-dark-900/80 border-slate-800 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-current'
              }`}
            />
            <span className="capitalize">{connectionStatus}</span>
          </div>

          {/* Real-Time WebRTC Quality & Diagnostics HUD Trigger */}
          <button
            onClick={() => setIsDiagnosticsOpen(prev => !prev)}
            className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur flex items-center gap-1.5 shadow-md transition-all ${
              diagnostics.connectionQuality === 'excellent' || diagnostics.connectionQuality === 'good'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/80'
                : diagnostics.connectionQuality === 'fair'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-400 hover:bg-amber-900/80'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-400 hover:bg-rose-900/80'
            }`}
            title="Toggle WebRTC Connection & Voice Diagnostics"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {diagnostics.rttMs !== null ? `${diagnostics.rttMs}ms` : 'Stats'}
            </span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-full glass-panel text-slate-300 hover:text-white border border-slate-800 hidden sm:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real-time Diagnostics HUD Modal Overlay */}
      {isDiagnosticsOpen && (
        <div className="absolute top-16 right-4 sm:right-6 z-50 w-80 sm:w-96 glass-panel rounded-2xl p-4 border border-slate-700/80 shadow-2xl backdrop-blur-2xl text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
              Live WebRTC Diagnostics
            </span>
            <button
              onClick={() => setIsDiagnosticsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-dark-900 border border-slate-800 space-y-0.5">
              <span className="text-slate-400">Connection Quality</span>
              <div className="font-bold capitalize text-emerald-400">{diagnostics.connectionQuality}</div>
            </div>
            <div className="p-2 rounded-xl bg-dark-900 border border-slate-800 space-y-0.5">
              <span className="text-slate-400">Latency (RTT)</span>
              <div className="font-bold text-white">{diagnostics.rttMs !== null ? `${diagnostics.rttMs} ms` : 'Measuring...'}</div>
            </div>
            <div className="p-2 rounded-xl bg-dark-900 border border-slate-800 space-y-0.5">
              <span className="text-slate-400">Packet Loss</span>
              <div className="font-bold text-white">{diagnostics.packetLossPercent !== null ? `${diagnostics.packetLossPercent}%` : '0%'}</div>
            </div>
            <div className="p-2 rounded-xl bg-dark-900 border border-slate-800 space-y-0.5">
              <span className="text-slate-400">Video Resolution</span>
              <div className="font-bold text-white">{diagnostics.videoResolution ? `${diagnostics.videoResolution} @ ${diagnostics.fps || 24}fps` : '640x480'}</div>
            </div>
          </div>

          {/* Audio & Voice Pipeline Details */}
          <div className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Local Microphone:</span>
              <span className={`font-bold ${diagnostics.localAudioTrackLive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAudioMuted ? 'Muted' : diagnostics.localAudioTrackLive ? 'Transmitting' : 'No Audio Track'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Remote Voice Stream:</span>
              <span className={`font-bold ${diagnostics.remoteAudioTrackLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {diagnostics.remoteAudioTrackLive ? 'Receiving & Playing' : 'Waiting for Audio'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Inbound Audio Bitrate:</span>
              <span className="font-mono text-white">{diagnostics.audioBitrateKbps !== null ? `${diagnostics.audioBitrateKbps} kbps` : 'Negotiating...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Inbound Video Bitrate:</span>
              <span className="font-mono text-white">{diagnostics.videoBitrateKbps !== null ? `${diagnostics.videoBitrateKbps} kbps` : 'Negotiating...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ICE Connection State:</span>
              <span className="font-bold capitalize text-brand-cyan">{diagnostics.iceConnectionState || connectionStatus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Dual Video Layout */}
      <div className="relative flex-1 w-full h-full p-2 sm:p-4 flex items-center justify-center">
        {/* Remote Stranger Main Stage Video OR Shared Screen */}
        <div className="relative w-full h-full max-w-6xl max-h-[82vh] mx-auto rounded-3xl overflow-hidden shadow-2xl">
          {/* If local user is sharing, main stage displays the local screen capture */}
          {isScreenSharing && screenStream ? (
            <VideoPlayer
              stream={screenStream}
              label="Your Shared Screen"
              isVideoOff={false}
              isScreenShare={true}
              showAudioRing={false}
              className="w-full h-full"
            />
          ) : (
            <VideoPlayer
              stream={remoteStream}
              label={isRemoteScreenSharing ? `${matchData?.peerName || 'Stranger'}'s Screen` : (matchData ? matchData.peerName : 'Waiting for Match...')}
              isVideoOff={isRemoteVideoDisabled}
              isRemoteMuted={isRemoteAudioMuted}
              isScreenShare={isRemoteScreenSharing}
              muteVideoElement={true}
              className="w-full h-full"
            />
          )}

          {/* Picture-in-Picture Self Video / Remote Video (Floating / Draggable) */}
          <motion.div
            drag
            dragConstraints={{ top: 0, left: -400, right: 0, bottom: 200 }}
            dragElastic={0.1}
            whileHover={{ scale: 1.02 }}
            className="absolute bottom-20 right-4 sm:bottom-6 sm:right-6 z-20 w-32 h-24 sm:w-56 sm:h-36 rounded-2xl overflow-hidden border-2 border-brand-purple/70 shadow-glow-purple cursor-grab active:cursor-grabbing backdrop-blur bg-dark-950"
          >
            {/* If local user is sharing screen, PiP shows remote stranger camera */}
            {isScreenSharing ? (
              <VideoPlayer
                stream={remoteStream}
                label={matchData?.peerName || 'Stranger'}
                isVideoOff={isRemoteVideoDisabled}
                isRemoteMuted={isRemoteAudioMuted}
                muteVideoElement={true}
                className="w-full h-full"
              />
            ) : (
              <VideoPlayer
                stream={localStream}
                isLocal={true}
                isMuted={isAudioMuted}
                isVideoOff={isVideoDisabled}
                isMirrored={settings.mirrorSelfVideo}
                label="YOU"
                showAudioRing={true}
                className="w-full h-full"
              />
            )}
          </motion.div>
        </div>

        {/* Text Chat Drawer Overlay */}
        <TextChatOverlay
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={sendMessage}
          onSendReaction={sendReaction}
          currentUserId={socket?.id || 'me'}
        />
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="relative z-30 pb-4 px-4 flex items-center justify-center">
        <div className="glass-panel px-4 py-2.5 rounded-2xl sm:rounded-full border border-slate-700/80 shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 backdrop-blur-xl">
          {/* NEXT / SKIP (Primary Action) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextMatch}
            className="px-5 py-2.5 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-purple via-indigo-600 to-brand-cyan shadow-glow-purple hover:shadow-glow-cyan transition-all duration-300 flex items-center gap-2 group"
            title="Skip to next stranger (Spacebar)"
          >
            <SkipForward className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            <span>Next Stranger</span>
          </motion.button>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Microphone Mute Toggle */}
          <button
            onClick={() => toggleAudio()}
            className={`p-2.5 rounded-xl sm:rounded-full text-xs font-semibold border transition-all ${
              isAudioMuted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30'
                : 'glass-button text-slate-200 hover:text-white border-slate-700'
            }`}
            title={isAudioMuted ? 'Unmute Mic (M)' : 'Mute Mic (M)'}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Camera On/Off Toggle */}
          <button
            onClick={() => toggleVideo()}
            className={`p-2.5 rounded-xl sm:rounded-full text-xs font-semibold border transition-all ${
              isVideoDisabled
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30'
                : 'glass-button text-slate-200 hover:text-white border-slate-700'
            }`}
            title={isVideoDisabled ? 'Turn Camera On (V)' : 'Turn Camera Off (V)'}
          >
            {isVideoDisabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>

          {/* SCREEN SHARING BUTTON */}
          <button
            onClick={handleShareScreenClick}
            className={`p-2.5 rounded-xl sm:rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isScreenSharing
                ? 'bg-rose-600 text-white border-rose-400 shadow-glow-pink animate-pulse'
                : 'glass-button text-slate-200 hover:text-white border-slate-700 hover:border-brand-cyan/50'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen with Stranger'}
          >
            {isScreenSharing ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span className="hidden md:inline font-bold">Stop Share</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 text-brand-cyan" />
                <span className="hidden md:inline font-bold">Share Screen</span>
              </>
            )}
          </button>

          {/* Text Chat Drawer Toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`relative p-2.5 rounded-xl sm:rounded-full text-xs font-semibold border transition-all ${
              isChatOpen
                ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50'
                : 'glass-button text-slate-200 hover:text-white border-slate-700'
            }`}
            title="Open Chat Drawer"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessagesCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-cyan text-dark-950 font-black text-[9px] rounded-full flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Quick Reaction Emoji Popover */}
          <div className="hidden lg:flex items-center gap-1 glass-panel-subtle px-2 py-1 rounded-full border border-slate-800">
            {QUICK_EMOJIS.slice(0, 4).map(emoji => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="hover:scale-125 active:scale-95 transition-transform text-sm p-1 rounded hover:bg-slate-800"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Report User */}
          <button
            onClick={() => setIsReportOpen(true)}
            className="p-2.5 rounded-xl sm:rounded-full text-xs text-rose-400 hover:text-rose-300 glass-button border-slate-800 hover:border-rose-500/40 transition-colors"
            title="Report Stranger"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          {/* Block User */}
          <button
            onClick={() => setIsBlockOpen(true)}
            className="p-2.5 rounded-xl sm:rounded-full text-xs text-amber-400 hover:text-amber-300 glass-button border-slate-800 hover:border-amber-500/40 transition-colors"
            title="Block Stranger"
          >
            <UserX className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl sm:rounded-full text-xs text-slate-400 hover:text-white glass-button border-slate-800 transition-colors"
            title="Call Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* End Call / Leave Lounge */}
          <button
            onClick={handleEndSession}
            className="p-2.5 rounded-xl sm:rounded-full bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold shadow-lg transition-colors"
            title="End Session"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Share Privacy Notice Confirmation Modal */}
      {showScreenSharePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Share Your Screen</h3>
                  <p className="text-[11px] text-slate-400">Stream your window, tab, or desktop in real time</p>
                </div>
              </div>
              <button
                onClick={() => setShowScreenSharePrompt(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Privacy & Safety Reminder</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Make sure your screen does <strong>not</strong> show passwords, banking applications, private chats, or personal information.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-brand-purple" />
              <span>VibeConnect streams peer-to-peer and never records your screen.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowScreenSharePrompt(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartScreenShare}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan font-bold text-white text-xs shadow-glow-purple hover:shadow-glow-cyan transition-all flex items-center gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Select Screen to Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        targetName={matchData?.peerName || 'Current Stranger'}
        onClose={() => setIsReportOpen(false)}
        onSubmitReport={(category, details) => {
          if (isScreenSharing) stopScreenShare();
          reportCurrentPartner(category, details);
          setIsReportOpen(false);
        }}
      />

      {/* Block Modal */}
      <BlockModal
        isOpen={isBlockOpen}
        targetName={matchData?.peerName || 'Current Stranger'}
        onClose={() => setIsBlockOpen(false)}
        onConfirmBlock={() => {
          if (isScreenSharing) stopScreenShare();
          blockCurrentPartner();
          setIsBlockOpen(false);
        }}
      />
    </div>
  );
};
