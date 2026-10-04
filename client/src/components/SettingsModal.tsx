import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Camera,
  Mic,
  Globe,
  ShieldCheck,
  Trash2,
  Server,
  Radio
} from 'lucide-react';
import { SupportedLanguage, UserSettings } from '../types';
import { SUPPORTED_LANGUAGES, VIDEO_QUALITY_PRESETS } from '../config/constants';
import { getAvailableDevices } from '../utils/mediaStream';
import { useSafety } from '../context/SafetyContext';
import { useSocket } from '../context/SocketContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
  settings,
  onUpdateSettings,
}) => {
  const { blockedUsers, unblockUser } = useSafety();
  const { isConnected, serverUrl, setServerUrl } = useSocket();

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'devices' | 'audio_video' | 'language' | 'safety' | 'server'>('devices');
  const [inputUrl, setInputUrl] = useState<string>(serverUrl);

  const [turnUrl, setTurnUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mingleo_turn_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        return typeof first?.urls === 'string' ? first.urls : (first?.urls?.[0] || '');
      }
    } catch {}
    return '';
  });
  const [turnUsername, setTurnUsername] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mingleo_turn_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        return first?.username || '';
      }
    } catch {}
    return '';
  });
  const [turnPassword, setTurnPassword] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mingleo_turn_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        return first?.credential || '';
      }
    } catch {}
    return '';
  });
  const [turnSavedStatus, setTurnSavedStatus] = useState<string>('');

  const handleSaveTurn = () => {
    if (turnUrl.trim() && turnUsername.trim() && turnPassword.trim()) {
      const config = [{
        urls: [turnUrl.trim(), `${turnUrl.trim()}?transport=tcp`],
        username: turnUsername.trim(),
        credential: turnPassword.trim(),
      }];
      localStorage.setItem('mingleo_turn_config', JSON.stringify(config));
      setTurnSavedStatus('TURN Relay saved! Will be used for all calls.');
    } else {
      localStorage.removeItem('mingleo_turn_config');
      setTurnSavedStatus('TURN cleared. Using Google & Cloudflare STUN.');
    }
    setTimeout(() => setTurnSavedStatus(''), 4000);
  };

  useEffect(() => {
    setInputUrl(serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    if (isOpen) {
      getAvailableDevices().then(devices => {
        setAvailableCameras(devices.cameras);
        setAvailableMics(devices.microphones);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center text-brand-purple">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Application Settings</h3>
              <p className="text-[11px] text-slate-400">Manage audio, video, strict language & privacy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'devices' ? 'bg-brand-purple text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Devices
          </button>
          <button
            onClick={() => setActiveTab('audio_video')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'audio_video' ? 'bg-brand-purple text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Quality & Audio
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'language' ? 'bg-brand-purple text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Language
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'safety' ? 'bg-brand-purple text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocklist ({blockedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'server' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>Server</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-brand-purple" />
                  Select Camera
                </label>
                <select
                  value={settings.selectedCameraId}
                  onChange={(e) => onUpdateSettings({ selectedCameraId: e.target.value })}
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-purple"
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

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-brand-cyan" />
                  Select Microphone
                </label>
                <select
                  value={settings.selectedMicrophoneId}
                  onChange={(e) => onUpdateSettings({ selectedMicrophoneId: e.target.value })}
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-purple"
                >
                  {availableMics.length > 0 ? (
                    availableMics.map(mic => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default System Microphone</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900/80 border border-slate-800">
                <span className="text-slate-300 font-medium">Mirror My Video Preview</span>
                <input
                  type="checkbox"
                  checked={settings.mirrorSelfVideo}
                  onChange={(e) => onUpdateSettings({ mirrorSelfVideo: e.target.checked })}
                  className="rounded text-brand-purple focus:ring-brand-purple bg-dark-950"
                />
              </div>
            </div>
          )}

          {activeTab === 'audio_video' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Video Resolution Preset</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['720p', '480p', '360p'] as const).map(presetKey => {
                    const preset = VIDEO_QUALITY_PRESETS[presetKey];
                    const isSelected = settings.videoQuality === presetKey;
                    return (
                      <button
                        key={presetKey}
                        onClick={() => onUpdateSettings({ videoQuality: presetKey })}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand-purple/20 border-brand-purple text-white'
                            : 'bg-dark-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{preset.label}</span>
                        <span className="text-[10px] text-slate-400">{preset.width}x{preset.height}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-slate-300 font-semibold">WebRTC Audio Enhancements</label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900 border border-slate-800 cursor-pointer">
                  <span>Echo Cancellation</span>
                  <input
                    type="checkbox"
                    checked={settings.echoCancellation}
                    onChange={(e) => onUpdateSettings({ echoCancellation: e.target.checked })}
                    className="rounded text-brand-cyan"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900 border border-slate-800 cursor-pointer">
                  <span>Noise Suppression</span>
                  <input
                    type="checkbox"
                    checked={settings.noiseSuppression}
                    onChange={(e) => onUpdateSettings({ noiseSuppression: e.target.checked })}
                    className="rounded text-brand-cyan"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900 border border-slate-800 cursor-pointer">
                  <span>Automatic Gain Control (AGC)</span>
                  <input
                    type="checkbox"
                    checked={settings.autoGainControl}
                    onChange={(e) => onUpdateSettings({ autoGainControl: e.target.checked })}
                    className="rounded text-brand-cyan"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-3">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-cyan" />
                Change Strict Language Preference
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => onSelectLanguage(lang.code)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-brand-cyan/20 border-brand-cyan text-white'
                          : 'bg-dark-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <div className="truncate">
                        <div className="font-bold truncate text-xs">{lang.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{lang.nativeName}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-3">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Blocked Users List
              </label>

              {blockedUsers.length === 0 ? (
                <div className="p-6 rounded-xl bg-dark-900/60 border border-slate-800 text-center text-slate-400">
                  You haven't blocked any users yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {blockedUsers.map(id => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900 border border-slate-800"
                    >
                      <span className="font-mono text-slate-300">{id}</span>
                      <button
                        onClick={() => unblockUser(id)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'server' && (
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div className={`p-4 rounded-2xl border ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <h4 className="font-bold text-sm text-white">
                    {isConnected ? 'Connected to Signaling Server' : 'Signaling Server Disconnected'}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isConnected
                    ? 'Your client is actively connected to the matchmaking server. Real live strangers will be paired with you.'
                    : 'Netlify hosts static files only. To match with real strangers across the internet, enter your live backend URL below (e.g., from Render.com).'}
                </p>
              </div>

              {/* Server URL Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Custom Backend Server URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://your-server.onrender.com"
                    className="flex-1 px-3 py-2 text-xs bg-dark-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    onClick={() => setServerUrl(inputUrl)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    Save & Connect
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Leave blank to use default (local port 5001 or VITE_SERVER_URL).
                </p>
              </div>

              {/* WebRTC TURN Relay Configuration (For 100% Mobile 4G/5G Cellular <-> Laptop NAT Traversal) */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-brand-purple" />
                    <span>WebRTC TURN Relay (Mobile Cellular & NAT Traversal)</span>
                  </label>
                  {turnSavedStatus && (
                    <span className="text-[10px] text-emerald-400 font-bold animate-pulse">{turnSavedStatus}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  By default, Google & Cloudflare STUN connect devices on WiFi. For cellular (4G/5G) mobile connections behind Symmetric NAT, add free TURN credentials from <a href="https://openrelayproject.org" target="_blank" rel="noreferrer" className="text-cyan-400 underline">OpenRelay</a> or <a href="https://metered.ca" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Metered.ca</a>.
                </p>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={turnUrl}
                    onChange={(e) => setTurnUrl(e.target.value)}
                    placeholder="TURN URL (e.g., turn:openrelay.metered.ca:443)"
                    className="w-full px-3 py-1.5 text-xs bg-dark-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={turnUsername}
                      onChange={(e) => setTurnUsername(e.target.value)}
                      placeholder="Username"
                      className="px-3 py-1.5 text-xs bg-dark-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple font-mono"
                    />
                    <input
                      type="password"
                      value={turnPassword}
                      onChange={(e) => setTurnPassword(e.target.value)}
                      placeholder="Password / Credential"
                      className="px-3 py-1.5 text-xs bg-dark-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={handleSaveTurn}
                      className="px-3.5 py-1.5 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      Save TURN Configuration
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-slate-300">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                  <Radio className="w-3.5 h-3.5" />
                  <span>How to deploy the backend for free (Render.com)</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] space-y-1 text-slate-400">
                  <li>Go to <strong className="text-slate-200">Render.com</strong> &rarr; Click <strong>New +</strong> &rarr; <strong>Web Service</strong>.</li>
                  <li>Connect your GitHub repo containing this project.</li>
                  <li>Set Root Directory to <code className="text-cyan-300">server</code>.</li>
                  <li>Set Build Command to <code className="text-cyan-300">npm install && npm run build</code>.</li>
                  <li>Set Start Command to <code className="text-cyan-300">npm start</code>.</li>
                  <li>Copy the resulting Render URL and paste it into the field above!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple/80 font-bold text-white text-xs transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
