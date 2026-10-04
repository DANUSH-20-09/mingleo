import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { SafetyProvider } from './context/SafetyContext';
import { SocketProvider } from './context/SocketContext';
import { MediaStreamProvider } from './context/MediaStreamContext';
import { UserSettings } from './types';
import './index.css';

const Root: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    selectedCameraId: '',
    selectedMicrophoneId: '',
    selectedAudioOutputId: '',
    videoQuality: '480p',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    mirrorSelfVideo: true,
    soundEffectsEnabled: true,
    speechSafetyConsent: false,
    themeAccent: 'purple'
  });

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <React.StrictMode>
      <ThemeProvider>
        <SafetyProvider>
          <SocketProvider>
            <MediaStreamProvider settings={settings}>
              <AppContent
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </MediaStreamProvider>
          </SocketProvider>
        </SafetyProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Root />);
