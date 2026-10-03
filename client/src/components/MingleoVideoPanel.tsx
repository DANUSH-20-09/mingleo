import React, { useRef } from 'react';
import {
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ChevronsRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Loader2,
  User,
  Monitor
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

interface MingleoVideoPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isSearching: boolean;
  isConnected: boolean;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  isRemoteAudioMuted?: boolean;
  isRemoteVideoDisabled?: boolean;
  isScreenSharing?: boolean;
  isRemoteScreenSharing?: boolean;
  isScreenShareSupported?: boolean;
  onToggleScreenShare?: () => void;
  strangerName?: string;
  selectedLanguageName?: string;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onEndCall: () => void;
  onNext: () => void;
  onStartChat: () => void;
}

export const MingleoVideoPanel: React.FC<MingleoVideoPanelProps> = ({
  localStream,
  remoteStream,
  isSearching,
  isConnected,
  isAudioMuted,
  isVideoDisabled,
  isRemoteAudioMuted = false,
  isRemoteVideoDisabled = false,
  isScreenSharing = false,
  isRemoteScreenSharing = false,
  isScreenShareSupported = true,
  onToggleScreenShare,
  strangerName = 'Stranger',
  selectedLanguageName = 'English',
  onToggleCam,
  onToggleMic,
  onEndCall,
  onNext,
  onStartChat,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full sm:w-[320px] md:w-[340px] lg:w-[360px] rounded-3xl p-3 sm:p-4 transition-all duration-300 bg-white dark:bg-[#0c101d] border border-slate-200/90 dark:border-slate-800/90 shadow-xl dark:shadow-2xl flex flex-col justify-between gap-3 text-left"
    >
      {/* 1. TOP VIDEO: STRANGER */}
      <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-inner flex items-center justify-center">
        {isConnected && remoteStream ? (
          <VideoPlayer
            stream={remoteStream}
            label={strangerName}
            isVideoOff={isRemoteVideoDisabled}
            isRemoteMuted={isRemoteAudioMuted}
            muteVideoElement={true}
            className="w-full h-full"
          />
        ) : isSearching ? (
          /* Animated Searching Radar */
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2.5">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-60" />
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">Searching for Stranger...</p>
              <p className="text-[10px] text-cyan-300/80 font-medium">{selectedLanguageName} speakers</p>
            </div>
          </div>
        ) : (
          /* Idle Placeholder (Stylized reference image appearance) */
          <div
            onClick={onStartChat}
            className="relative w-full h-full group cursor-pointer overflow-hidden flex flex-col items-center justify-center"
          >
            {/* Friendly Stranger Avatar Photo Silhouette */}
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80"
              alt="Stranger Placeholder"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-dark-950/40" />

            {/* Click to Connect overlay badge */}
            <div className="relative z-10 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg group-hover:bg-blue-600 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tap to Connect</span>
            </div>
          </div>
        )}

        {/* Top Left Badge: Stranger */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span>Stranger</span>
            {isRemoteScreenSharing && (
              <span className="text-[10px] text-cyan-400 font-normal ml-1">• Screen</span>
            )}
          </span>
        </div>

        {/* Top Right Expand Icon */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white text-xs border border-white/10 transition-colors"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. BOTTOM VIDEO: YOU */}
      <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-inner flex items-center justify-center">
        {localStream ? (
          <VideoPlayer
            stream={localStream}
            isLocal={true}
            isMuted={isAudioMuted}
            isVideoOff={isVideoDisabled}
            isMirrored={true}
            label="You"
            className="w-full h-full"
          />
        ) : (
          /* You Camera Preview Placeholder */
          <div
            onClick={onStartChat}
            className="relative w-full h-full group cursor-pointer overflow-hidden flex flex-col items-center justify-center"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
              alt="You Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-dark-950/40" />

            <div className="relative z-10 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg group-hover:bg-purple-600 transition-colors">
              <User className="w-3.5 h-3.5 text-pink-400" />
              <span>Enable Camera</span>
            </div>
          </div>
        )}

        {/* Top Left Badge: You */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${localStream && !isVideoDisabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>You</span>
          </span>
        </div>

        {/* Top Right Expand Icon */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white text-xs border border-white/10 transition-colors"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3. BOTTOM CONTROL BAR (Cam, Mic, End, Next) - Matches Reference Image */}
      <div className="pt-1 flex items-center justify-around select-none">
        {/* Cam Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onToggleCam}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isVideoDisabled
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm'
            }`}
            title={isVideoDisabled ? 'Turn Cam On' : 'Turn Cam Off'}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cam</span>
        </div>

        {/* Mic Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onToggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isAudioMuted
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm'
            }`}
            title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Mic</span>
        </div>

        {/* Screen Share Button */}
        {isScreenShareSupported && onToggleScreenShare && (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onToggleScreenShare}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                isScreenSharing
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen, Window or Tab'}
            >
              <Monitor className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Share</span>
          </div>
        )}

        {/* End Button (Red Circular Button) */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onEndCall}
            className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">End</span>
        </div>

        {/* Next Button (Vibrant Blue/Purple >> Circular Button) */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onNext}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
            title="Next Stranger"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400">Next</span>
        </div>
      </div>
    </div>
  );
};
