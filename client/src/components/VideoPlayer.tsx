import React, { useEffect, useRef, useState, memo } from 'react';
import { User, VideoOff, MicOff, Monitor, VolumeX } from 'lucide-react';

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
  const [isAudioRestricted, setIsAudioRestricted] = useState<boolean>(false);
  const [hasActiveVideoTrack, setHasActiveVideoTrack] = useState<boolean>(() => {
    return !!stream && stream.getVideoTracks().some(t => t.readyState !== 'ended');
  });

  // Local audio is always muted to prevent echo. Remote audio plays unless muted or restricted by browser.
  const shouldMuteAudio = isLocal || isMuted || isRemoteMuted || muteVideoElement;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!stream) {
      videoEl.srcObject = null;
      setHasActiveVideoTrack(false);
      return;
    }

    const checkVideo = () => {
      const vTracks = stream.getVideoTracks();
      const hasLive = vTracks.length > 0 && vTracks.some(t => t.readyState !== 'ended');
      setHasActiveVideoTrack(hasLive);
    };

    checkVideo();

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
    videoEl.autoplay = true;
    videoEl.playsInline = true;

    // Apply muted state
    const effectiveMute = shouldMuteAudio || isAudioRestricted;
    videoEl.muted = effectiveMute;
    if (!isLocal) {
      videoEl.volume = 1.0;
    }

    const startPlayback = async () => {
      try {
        await videoEl.play();
        // If unmuted playback succeeded and was previously marked restricted, lift restriction
        if (!shouldMuteAudio && isAudioRestricted) {
          videoEl.muted = false;
          setIsAudioRestricted(false);
        }
      } catch (err: any) {
        console.warn('[VideoPlayer] Play call error:', err?.name, err?.message);
        if (err?.name === 'NotAllowedError') {
          // Autoplay restricted: mute and play so video continues, show unmute pill
          videoEl.muted = true;
          setIsAudioRestricted(true);
          videoEl.play().catch(() => {});
        } else {
          videoEl.play().catch(() => {});
        }
      }
    };

    startPlayback();

    const handleTrackChange = () => {
      if (videoEl && stream) {
        if (videoEl.srcObject !== stream) {
          videoEl.srcObject = stream;
        }
        checkVideo();
        startPlayback();
      }
    };

    stream.addEventListener('addtrack', handleTrackChange);
    stream.addEventListener('removetrack', handleTrackChange);

    stream.getVideoTracks().forEach(t => {
      t.addEventListener('unmute', () => {
        checkVideo();
        startPlayback();
      });
      t.addEventListener('mute', checkVideo);
    });

    return () => {
      stream.removeEventListener('addtrack', handleTrackChange);
      stream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [stream, shouldMuteAudio, isAudioRestricted]);

  const handleUnmute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = false;
      videoEl.volume = 1.0;
      videoEl.play().then(() => {
        setIsAudioRestricted(false);
      }).catch((err) => {
        console.warn('[VideoPlayer] Manual unmute rejected:', err);
        videoEl.muted = true;
        setIsAudioRestricted(true);
      });
    }
  };

  return (
    <div
      onClick={isAudioRestricted && !isLocal ? handleUnmute : undefined}
      className={`relative w-full h-full bg-slate-950 overflow-hidden rounded-2xl border border-slate-800/80 shadow-glass transition-colors select-none ${className}`}
    >
      {/* Active Video Stream Element - Always mounted and rendering */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        muted={shouldMuteAudio || isAudioRestricted}
        onLoadedMetadata={() => {
          videoRef.current?.play().catch(() => {});
        }}
        onCanPlay={() => {
          videoRef.current?.play().catch(() => {});
        }}
        className={`w-full h-full transition-opacity duration-200 ${
          isVideoOff || !stream || !hasActiveVideoTrack ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 block'
        } ${
          isScreenShare
            ? 'object-contain bg-black'
            : `object-cover ${isMirrored ? 'video-mirrored' : ''}`
        }`}
      />

      {/* Camera Off or Waiting Placeholder Overlay */}
      {(!stream || isVideoOff || !hasActiveVideoTrack) && (
        <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center bg-[#070b14]/95 text-slate-400 p-4 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-2 shadow-inner">
            {isVideoOff ? (
              <VideoOff className="w-7 h-7 text-slate-500" />
            ) : (
              <User className="w-7 h-7 text-cyan-400 animate-pulse" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-300">
            {isVideoOff
              ? 'Camera is turned off'
              : !stream
              ? (isLocal ? 'Starting camera...' : 'Connecting to stranger...')
              : !hasActiveVideoTrack
              ? (isLocal ? 'Enabling video stream...' : 'Waiting for video stream...')
              : 'Connecting...'}
          </span>
        </div>
      )}

      {/* Sleek Floating Unmute Button (Never blocks video visibility!) */}
      {isAudioRestricted && !isLocal && (
        <div className="absolute top-3 right-3 z-30 pointer-events-auto animate-bounce">
          <button
            onClick={handleUnmute}
            className="px-3.5 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/40 flex items-center gap-1.5 transition-transform hover:scale-105"
          >
            <VolumeX className="w-4 h-4 text-slate-950" />
            <span>Tap to Unmute</span>
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
