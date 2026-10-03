import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Mic,
  Wifi,
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  Volume2,
  FlipHorizontal,
  Info
} from 'lucide-react';
import { useMediaStream } from '../context/MediaStreamContext';
import { ICE_SERVERS } from '../config/constants';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';

interface DeviceDiagnosticScreenProps {
  onBack: () => void;
  onProceed: () => void;
}

type CheckStatus = 'pending' | 'checking' | 'success' | 'warning' | 'error';

export const DeviceDiagnosticScreen: React.FC<DeviceDiagnosticScreenProps> = ({
  onBack,
  onProceed,
}) => {
  const {
    localStream,
    errorDiagnosis,
    initializeMedia,
    flipCamera,
    facingMode,
    availableCameras,
    availableMicrophones
  } = useMediaStream();

  const [cameraStatus, setCameraStatus] = useState<CheckStatus>('checking');
  const [micStatus, setMicStatus] = useState<CheckStatus>('checking');
  const [networkStatus, setNetworkStatus] = useState<CheckStatus>('checking');
  const [webrtcStatus, setWebrtcStatus] = useState<CheckStatus>('checking');
  const [cameraLabel, setCameraLabel] = useState<string>('Detecting camera...');
  const [micLabel, setMicLabel] = useState<string>('Detecting microphone...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { volume } = useAudioVisualizer(localStream, true);

  // 1. Run all diagnostic checks
  const runDiagnostics = async () => {
    setCameraStatus('checking');
    setMicStatus('checking');
    setNetworkStatus('checking');
    setWebrtcStatus('checking');

    // Network check
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setNetworkStatus('success');
    } else {
      setNetworkStatus('error');
    }

    // Request/Verify Media Stream
    let stream = localStream;
    if (!stream || stream.getTracks().some(t => t.readyState === 'ended')) {
      stream = await initializeMedia();
    }

    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
        setCameraStatus('success');
        setCameraLabel(videoTracks[0].label || 'Default Camera (Active)');
      } else {
        setCameraStatus('error');
        setCameraLabel('No active video track');
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
        setMicStatus('success');
        setMicLabel(audioTracks[0].label || 'Default Microphone (Active)');
      } else {
        setMicStatus('error');
        setMicLabel('No active audio track');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Preview play notice:', e));
      }
    } else {
      setCameraStatus(errorDiagnosis?.type === 'not_found' ? 'warning' : 'error');
      setMicStatus(errorDiagnosis?.type === 'not_found' ? 'warning' : 'error');
      setCameraLabel(errorDiagnosis?.title || 'Camera not accessible');
      setMicLabel(errorDiagnosis?.title || 'Microphone not accessible');
    }

    // WebRTC STUN Connectivity Check
    testWebRTCConnectivity();
  };

  const testWebRTCConnectivity = () => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      let candidateFound = false;

      const timeout = setTimeout(() => {
        if (!candidateFound) {
          setWebrtcStatus('warning');
          pc.close();
        }
      }, 5000);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidateFound = true;
          clearTimeout(timeout);
          setWebrtcStatus('success');
          pc.close();
        }
      };

      // Trigger ICE gathering with a dummy data channel
      pc.createDataChannel('diag_test');
      pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {
        setWebrtcStatus('error');
      });
    } catch {
      setWebrtcStatus('error');
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  useEffect(() => {
    if (videoRef.current && localStream) {
      if (videoRef.current.srcObject !== localStream) {
        videoRef.current.srcObject = localStream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [localStream, cameraStatus]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white glass-button px-3 py-1.5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Setup</span>
        </button>

        <div className="px-3 py-1 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 text-xs text-brand-cyan font-bold flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Device & Network Diagnostics</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Real-Time Diagnostic Dashboard (6 cols) */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 shadow-glass">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Pre-Call Hardware Tests</h3>
              <button
                onClick={runDiagnostics}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:text-brand-cyan transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retest All</span>
              </button>
            </div>

            {/* Test 1: Camera Access & Preview */}
            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center text-brand-purple">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Camera Check</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">{cameraLabel}</div>
                </div>
              </div>
              <StatusBadge status={cameraStatus} successLabel="Working" errorLabel="Failed" />
            </div>

            {/* Test 2: Microphone Access */}
            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Microphone Check</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">{micLabel}</div>
                </div>
              </div>
              <StatusBadge status={micStatus} successLabel="Working" errorLabel="Failed" />
            </div>

            {/* Test 3: Microphone Audio Input Activity Meter */}
            <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Live Audio Input Meter:
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">{volume}%</span>
              </div>
              <div className="w-full h-2.5 bg-dark-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-brand-cyan via-brand-purple to-emerald-400 transition-all duration-100 rounded-full"
                  style={{ width: `${Math.min(100, volume * 1.5)}%` }}
                />
              </div>
              {volume > 15 ? (
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Voice detected! Microphone is transmitting clearly.
                </p>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Speak into your microphone to verify audio input sensitivity.
                </p>
              )}
            </div>

            {/* Test 4: Internet Connection */}
            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Network Connectivity</div>
                  <div className="text-[10px] text-slate-400">Online & Low Latency Ready</div>
                </div>
              </div>
              <StatusBadge status={networkStatus} successLabel="Connected" errorLabel="Offline" />
            </div>

            {/* Test 5: WebRTC STUN / ICE Connectivity */}
            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-pink/20 border border-brand-pink/30 flex items-center justify-center text-brand-pink">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">WebRTC STUN / NAT</div>
                  <div className="text-[10px] text-slate-400">P2P Media Channel Negotiation</div>
                </div>
              </div>
              <StatusBadge status={webrtcStatus} successLabel="Connected" errorLabel="Blocked" />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => initializeMedia()}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl glass-button text-xs font-bold text-white hover:border-brand-purple flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-Request Permissions</span>
            </button>

            <button
              onClick={onProceed}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-xs font-bold text-white shadow-glow-cyan flex items-center justify-center gap-2"
            >
              <span>Continue to Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Camera Video Element & Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Video Monitor
              </span>
              <button
                onClick={flipCamera}
                className="flex items-center gap-1 text-xs text-brand-cyan hover:text-white glass-button px-2.5 py-1 rounded-lg transition-colors"
                title="Switch Front/Rear Camera"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Flip ({facingMode === 'user' ? 'Front' : 'Rear'})</span>
              </button>
            </div>

            {/* Video Box */}
            <div className="relative aspect-video rounded-xl bg-dark-950 overflow-hidden border border-slate-800 flex items-center justify-center">
              {localStream && cameraStatus === 'success' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'video-mirrored' : ''}`}
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No active camera preview</p>
                </div>
              )}

              {/* Status Pill */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-dark-950/80 backdrop-blur border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cameraStatus === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {cameraStatus === 'success' ? 'Camera Live' : 'Camera Inactive'}
                </span>
              </div>
            </div>

            {/* Detected Devices Count */}
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Cameras: <strong className="text-white">{availableCameras.length} detected</strong></span>
              <span>Microphones: <strong className="text-white">{availableMicrophones.length} detected</strong></span>
            </div>
          </div>

          {/* Error / Guidance Notice if any error */}
          {errorDiagnosis && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorDiagnosis.title}</span>
              </div>
              <p className="text-xs text-rose-100 leading-relaxed">{errorDiagnosis.message}</p>
              <div className="p-2.5 rounded-xl bg-dark-950/60 border border-rose-900/60 text-[11px] text-slate-300 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                <span>{errorDiagnosis.solution}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function StatusBadge({
  status,
  successLabel,
  errorLabel
}: {
  status: CheckStatus;
  successLabel: string;
  errorLabel: string;
}) {
  if (status === 'checking') {
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-ping" />
        Testing...
      </span>
    );
  }

  if (status === 'success') {
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {successLabel}
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-[10px] font-bold text-amber-400 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Check Notice
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-[10px] font-bold text-rose-400 flex items-center gap-1">
      <XCircle className="w-3 h-3" />
      {errorLabel}
    </span>
  );
}
