import React, { useEffect, useRef, useState, memo } from 'react';
import { User, VideoOff, MicOff, Monitor, VolumeX, Volume2 } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  isRemoteMuted?: boolean;
  isLocal?: boolean;
  isMirrored?: boolean;
  label?: string;
  isVideoOff?: boolean;
  isScreenShare?: boolean;
  showAudioRing?: boolean;
  muteVideoElement?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = memo(({
  stream,
  isMuted = false,
  isRemoteMuted = false,
  isLocal = false,
  isMirrored = false,
  label,
  isVideoOff = false,
  isScreenShare = false,
  muteVideoElement = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  const shouldMuteVideo = isLocal || isMuted || muteVideoElement;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!stream) {
      videoEl.srcObject = null;
      return;
    }

    // Always ensure current stream is assigned
    videoEl.srcObject = stream;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = shouldMuteVideo;

    const tryPlay = () => {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            if (!shouldMuteVideo) {
              console.warn('[VideoPlayer] Unmuted playback blocked by autoplay policy:', err.message);
              setAutoplayBlocked(true);
            }
          });
      }
    };

    tryPlay();

    const handleTrackChange = () => {
      if (videoEl && stream) {
        videoEl.srcObject = stream;
        tryPlay();
      }
    };

    stream.addEventListener('addtrack', handleTrackChange);
    stream.addEventListener('removetrack', handleTrackChange);

    return () => {
      stream.removeEventListener('addtrack', handleTrackChange);
      stream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [stream, shouldMuteVideo]);

  const handleEnableAudio = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = false;
      videoEl.play()
        .then(() => {
          setAutoplayBlocked(false);
        })
        .catch(() => {
          videoEl.muted = true;
          videoEl.play();
        });
    }
  };

  return (
    <div
      className={`relative w-full h-full bg-slate-950 overflow-hidden rounded-2xl border border-slate-800/80 shadow-glass transition-colors ${className}`}
    >
      {/* Active Video Stream Element - always mounted and visible to browser compositor to prevent Android decoder pauses */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={shouldMuteVideo}
        onLoadedMetadata={() => {
          videoRef.current?.play().catch(() => {});
        }}
        onCanPlay={() => {
          videoRef.current?.play().catch(() => {});
        }}
        onPause={() => {
          if (stream && !isVideoOff) {
            videoRef.current?.play().catch(() => {});
          }
        }}
        className={`w-full h-full transition-opacity duration-200 ${
          isVideoOff || !stream ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 block'
        } ${
          isScreenShare
            ? 'object-contain bg-black'
            : `object-cover ${isMirrored ? 'video-mirrored' : ''}`
        }`}
      />

      {/* Camera Off or Waiting Placeholder Overlay */}
      {(!stream || isVideoOff) && (
        <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center bg-[#070b14]/95 text-slate-400 p-4 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-2 shadow-inner">
            {isVideoOff ? (
              <VideoOff className="w-7 h-7 text-slate-500" />
            ) : (
              <User className="w-7 h-7 text-cyan-400 animate-pulse" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-300">
            {isVideoOff ? 'Camera is turned off' : 'Waiting for video stream...'}
          </span>
        </div>
      )}

      {/* Autoplay blocked overlay for unmuted video */}
      {autoplayBlocked && !isLocal && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-dark-950/85 backdrop-blur-sm p-4 text-center select-none">
          <div className="w-12 h-12 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan mb-2 animate-bounce">
            <VolumeX className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Audio Autoplay Restricted</h4>
          <p className="text-xs text-slate-300 mb-3 max-w-xs">
            Your browser requires a quick tap to enable audio playback.
          </p>
          <button
            onClick={handleEnableAudio}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-bold shadow-glow-cyan hover:opacity-90 flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4" />
            <span>Tap to Enable Audio</span>
          </button>
        </div>
      )}

      {/* Label Badge */}
      {label && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-dark-950/80 backdrop-blur border border-slate-700/80 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md">
            {isScreenShare && <Monitor className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{label}</span>
          </div>
        </div>
      )}

      {/* Local Mute Indicator */}
      {isLocal && isMuted && (
        <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded-full bg-rose-500/80 backdrop-blur text-[10px] font-bold text-white flex items-center gap-1 border border-rose-400 shadow-md pointer-events-none">
          <MicOff className="w-3 h-3" />
          <span>MUTED</span>
        </div>
      )}

      {/* Remote Stranger Muted Indicator */}
      {!isLocal && isRemoteMuted && (
        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-rose-500/90 backdrop-blur text-[10px] font-bold text-white flex items-center gap-1.5 border border-rose-400 shadow-md pointer-events-none animate-in fade-in">
          <MicOff className="w-3.5 h-3.5" />
          <span>STRANGER MUTED</span>
        </div>
      )}
    </div>
  );
});
