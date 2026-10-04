import React, { useState, useEffect } from 'react';
import { MingleoLiveRoom } from './components/MingleoLiveRoom';
import { MingleoIntroSplash } from './components/MingleoIntroSplash';
import { SettingsModal } from './components/SettingsModal';
import { CommunityGuidelinesModal } from './components/CommunityGuidelinesModal';
import { AboutPrivacyModal } from './components/AboutPrivacyModal';
import { LoginModal } from './components/LoginModal';
import { ReportModal } from './components/ReportModal';
import { Toast } from './components/Toast';
import { useSocket } from './context/SocketContext';
import { useSafety } from './context/SafetyContext';
import { useMediaStream } from './context/MediaStreamContext';
import { useWebRTC } from './hooks/useWebRTC';
import { UserSettings } from './types';
import { speechSafety } from './utils/speechSafety';

interface AppContentProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const AppContent: React.FC<AppContentProps> = ({ settings, onUpdateSettings }) => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    username: _username,
    setUsername: _setUsername,
    isSearching,
    matchData,
    startSearch,
    cancelSearch: _cancelSearch,
    nextMatch,
    endCall,
    messages,
    sendMessage,
    reportCurrentPartner,
    socket,
    guestId,
    isConnected: isSocketConnected,
    onlineCount,
    activeChattingCount,
    inQueueCount,
  } = useSocket();

  const { activeWarning, clearWarning } = useSafety();
  const { localStream, initializeMedia } = useMediaStream();

  // Core WebRTC connection manager
  const {
    remoteStream,
    screenStream,
    isAudioMuted,
    isVideoDisabled,
    isRemoteAudioMuted,
    isRemoteVideoDisabled,
    isScreenSharing,
    isRemoteScreenSharing,
    isScreenShareSupported,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC({
    socket,
    localStream,
    matchData,
  });

  // Entry intro animation state
  const [showIntroSplash, setShowIntroSplash] = useState<boolean>(true);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Global user interaction listener to unblock audio autoplay on mobile Android/iOS
  useEffect(() => {
    const unlockAudio = () => {
      document.querySelectorAll('video').forEach(vid => {
        if (vid.srcObject && vid.paused) {
          vid.play().catch(() => {});
        }
      });
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Handle Speech Safety recognition during active calls (disabled on mobile to prevent Android/iOS mic contention)
  useEffect(() => {
    const isCallActive = !!matchData;
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isCallActive && settings.speechSafetyConsent && speechSafety.isSupported() && !isMobile) {
      speechSafety.start((transcript) => {
        if (socket && transcript.trim()) {
          socket.emit('transcription_check', {
            text: transcript,
            language: selectedLanguage,
          });
        }
      });
    } else {
      speechSafety.stop();
    }

    return () => {
      speechSafety.stop();
    };
  }, [matchData, settings.speechSafetyConsent, socket, selectedLanguage]);

  // Auto-initialize media on load so local camera preview is ready immediately
  useEffect(() => {
    initializeMedia().catch((err) => {
      console.warn('Initial camera/mic setup waiting for user action:', err);
    });
  }, [initializeMedia]);

  const handleToggleCam = async () => {
    const videoTracks = localStream?.getVideoTracks() || [];
    const hasLiveVideo = videoTracks.some(t => t.readyState === 'live');
    if (!localStream || !hasLiveVideo) {
      try {
        const stream = await initializeMedia();
        if (stream) {
          toggleVideo(false);
        }
      } catch (err) {
        console.error('Failed to initialize camera:', err);
      }
      return;
    }
    toggleVideo();
  };

  const handleToggleMic = async () => {
    const audioTracks = localStream?.getAudioTracks() || [];
    const hasLiveAudio = audioTracks.some(t => t.readyState === 'live');
    if (!localStream || !hasLiveAudio) {
      try {
        const stream = await initializeMedia();
        if (stream) {
          toggleAudio(false);
        }
      } catch (err) {
        console.error('Failed to initialize microphone:', err);
      }
      return;
    }
    toggleAudio();
  };

  const ensureMediaReady = async (): Promise<boolean> => {
    let stream = localStream;
    const hasLiveVideo = stream?.getVideoTracks().some(t => t.readyState === 'live');
    const hasLiveAudio = stream?.getAudioTracks().some(t => t.readyState === 'live');
    if (!stream || !hasLiveVideo || !hasLiveAudio) {
      try {
        stream = await initializeMedia();
      } catch (err) {
        console.error('Error initializing camera/mic:', err);
      }
    }
    return !!stream && stream.getVideoTracks().some(t => t.readyState === 'live');
  };

  const handleStartVideoChat = async () => {
    const isReady = await ensureMediaReady();
    if (!isReady) {
      alert('Camera and microphone access is required for video chat. Please allow browser permissions and try again.');
      return;
    }
    startSearch();
  };

  const handleNextMatch = async () => {
    const isReady = await ensureMediaReady();
    if (!isReady) {
      alert('Camera access is required for video chat. Please allow camera permissions to continue.');
      return;
    }
    nextMatch(true);
  };

  const handleEndCall = () => {
    endCall();
  };

  const isConnected = !!matchData;
  const currentUserId = socket?.id || guestId;

  return (
    <>
      {/* 1. Cinematic Entry Intro Splash Animation */}
      {showIntroSplash && (
        <MingleoIntroSplash onComplete={() => setShowIntroSplash(false)} />
      )}

      {/* 2. Unified Best Video Chat Interface (MingleoLiveRoom) */}
      <MingleoLiveRoom
        localStream={localStream}
        remoteStream={remoteStream}
        screenStream={screenStream}
        isSearching={isSearching}
        isConnected={isConnected}
        isAudioMuted={isAudioMuted}
        isVideoDisabled={isVideoDisabled}
        isRemoteAudioMuted={isRemoteAudioMuted}
        isRemoteVideoDisabled={isRemoteVideoDisabled}
        isScreenSharing={isScreenSharing}
        isRemoteScreenSharing={isRemoteScreenSharing}
        isScreenShareSupported={isScreenShareSupported}
        onToggleCam={handleToggleCam}
        onToggleMic={handleToggleMic}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onEndCall={handleEndCall}
        onNext={handleNextMatch}
        onStartChat={handleStartVideoChat}
        messages={messages}
        onSendMessage={sendMessage}
        currentUserId={currentUserId}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        isSocketConnected={isSocketConnected}
        onlineCount={onlineCount}
        activeChattingCount={activeChattingCount}
        inQueueCount={inQueueCount}
      />

      {/* Floating Moderation Toast */}
      <Toast warning={activeWarning} onDismiss={clearWarning} />

      {/* Report & Block Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetName={matchData?.peerName || 'Stranger'}
        onSubmitReport={(category, details) => {
          reportCurrentPartner(category, details);
          setIsReportOpen(false);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Community Guidelines Modal */}
      <CommunityGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      {/* About & Privacy Modal */}
      <AboutPrivacyModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Login / Profile Nickname Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
};
