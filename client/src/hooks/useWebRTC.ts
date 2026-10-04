import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { ICE_SERVERS } from '../config/constants';
import { WebRTCConnectionStatus, WebRTCDiagnostics } from '../types';

interface UseWebRTCProps {
  socket: Socket | null;
  localStream: MediaStream | null;
  matchData: {
    roomId: string;
    peerSocketId: string;
    peerName: string;
    isInitiator: boolean;
    language: string;
  } | null;
}

export function useWebRTC({ socket, localStream, matchData }: UseWebRTCProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<WebRTCConnectionStatus>('idle');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState<boolean>(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState<boolean>(false);
  const [isRemoteVideoDisabled, setIsRemoteVideoDisabled] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState<boolean>(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [diagnostics, setDiagnostics] = useState<WebRTCDiagnostics>({
    rttMs: null,
    packetLossPercent: null,
    audioBitrateKbps: null,
    videoBitrateKbps: null,
    videoResolution: null,
    fps: null,
    connectionQuality: 'checking',
    localAudioTrackLive: false,
    localVideoTrackLive: false,
    remoteAudioTrackLive: false,
    remoteVideoTrackLive: false,
    iceConnectionState: null,
    iceGatheringState: null,
    signalingState: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const statsIntervalRef = useRef<any>(null);
  const prevStatsRef = useRef<{ timestamp: number; audioBytes: number; videoBytes: number }>({
    timestamp: 0,
    audioBytes: 0,
    videoBytes: 0,
  });

  const isScreenShareSupported = typeof navigator !== 'undefined' &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

  // Toggle Audio (Mute / Unmute)
  const toggleAudio = useCallback((forceState?: boolean) => {
    setIsAudioMuted(prevMuted => {
      const nextMuted = (typeof forceState === 'boolean') ? forceState : !prevMuted;
      const nextEnabled = !nextMuted;

      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = nextEnabled;
        });
      }

      // Synchronize with active peer connection audio sender
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.getSenders().forEach(sender => {
            if (sender.track && sender.track.kind === 'audio') {
              sender.track.enabled = nextEnabled;
            }
          });
        } catch (e) {
          console.warn('[WebRTC] Error updating sender track enabled state:', e);
        }
      }

      if (socket && matchData) {
        socket.emit('media_state_change', {
          roomId: matchData.roomId,
          isAudioMuted: nextMuted,
        });
      }

      return nextMuted;
    });
  }, [localStream, socket, matchData]);

  // Toggle Video (Camera On / Off)
  const toggleVideo = useCallback((forceState?: boolean) => {
    setIsVideoDisabled(prevDisabled => {
      const nextDisabled = (typeof forceState === 'boolean') ? forceState : !prevDisabled;
      const nextEnabled = !nextDisabled;

      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = nextEnabled;
        });
      }

      // Synchronize with active peer connection video sender
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.getSenders().forEach(sender => {
            if (sender.track && sender.track.kind === 'video') {
              sender.track.enabled = nextEnabled;
            }
          });
        } catch (e) {
          console.warn('[WebRTC] Error updating sender track enabled state:', e);
        }
      }

      if (socket && matchData) {
        socket.emit('media_state_change', {
          roomId: matchData.roomId,
          isVideoDisabled: nextDisabled,
        });
      }

      return nextDisabled;
    });
  }, [localStream, socket, matchData]);

  // Stop Screen Sharing
  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);

    // Revert WebRTC sender track back to camera video track
    if (peerConnectionRef.current && localStream) {
      const cameraVideoTrack = localStream.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender && cameraVideoTrack) {
        try {
          await videoSender.replaceTrack(cameraVideoTrack);
          console.log('[WebRTC] Reverted video track to camera.');
        } catch (err) {
          console.warn('[WebRTC] Error replacing track back to camera:', err);
        }
      }
    }

    if (socket && matchData) {
      socket.emit('screen_share_change', {
        roomId: matchData.roomId,
        isSharing: false
      });
    }
  }, [localStream, socket, matchData]);

  // Start Screen Sharing
  const startScreenShare = useCallback(async (): Promise<boolean> => {
    if (!isScreenShareSupported) {
      alert('Screen sharing is not supported on this device or browser.');
      return false;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        } as any,
        audio: true
      });

      const screenVideoTrack = displayStream.getVideoTracks()[0];
      if (!screenVideoTrack) return false;

      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setIsScreenSharing(true);

      // Replace active video track on peer connection
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
          console.log('[WebRTC] Replaced video track with screen capture.');
        } else {
          // If no video sender yet, add track
          peerConnectionRef.current.addTrack(screenVideoTrack, displayStream);
        }
      }

      // Handle native browser "Stop sharing" floating bar button
      screenVideoTrack.onended = () => {
        console.log('[WebRTC] Native screen share ended by user.');
        stopScreenShare();
      };

      if (socket && matchData) {
        socket.emit('screen_share_change', {
          roomId: matchData.roomId,
          isSharing: true
        });
      }

      return true;
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error('[WebRTC] Error starting screen share:', err);
      }
      return false;
    }
  }, [isScreenShareSupported, matchData, socket, stopScreenShare]);

  // Cleanup WebRTC connection
  const cleanupConnection = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    setIsRemoteScreenSharing(false);

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    iceCandidatesQueue.current = [];
    setRemoteStream(null);
    setIsRemoteAudioMuted(false);
    setIsRemoteVideoDisabled(false);
    setConnectionStatus('idle');
    setDiagnostics({
      rttMs: null,
      packetLossPercent: null,
      audioBitrateKbps: null,
      videoBitrateKbps: null,
      videoResolution: null,
      fps: null,
      connectionQuality: 'checking',
      localAudioTrackLive: false,
      localVideoTrackLive: false,
      remoteAudioTrackLive: false,
      remoteVideoTrackLive: false,
      iceConnectionState: null,
      iceGatheringState: null,
      signalingState: null,
    });
  }, []);

  // Initialize WebRTC session on Match
  useEffect(() => {
    if (!matchData) {
      cleanupConnection();
      return;
    }

    // Real WebRTC Peer Connection
    if (!socket) return;

    setConnectionStatus('connecting');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // 1. Audio track binding or receive-only transceiver
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isAudioMuted;
      try {
        pc.addTrack(audioTrack, localStream!);
        console.log(`[WebRTC] Attached local audio track (${audioTrack.id})`);
      } catch (e) {
        console.warn('[WebRTC] Audio track attach warning:', e);
      }
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } catch (e) {
        console.warn('[WebRTC] Audio transceiver warning:', e);
      }
    }

    // 2. Video track binding or receive-only transceiver
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isVideoDisabled;
      try {
        pc.addTrack(videoTrack, localStream!);
        console.log(`[WebRTC] Attached local video track (${videoTrack.id})`);
      } catch (e) {
        console.warn('[WebRTC] Video track attach warning:', e);
      }
    } else {
      try {
        pc.addTransceiver('video', { direction: 'recvonly' });
      } catch (e) {
        console.warn('[WebRTC] Video transceiver warning:', e);
      }
    }

    // Handle remote track reception
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote stream track: ${event.track.kind} (id: ${event.track.id}, enabled: ${event.track.enabled})`);
      event.track.enabled = true;

      const refreshRemoteStream = () => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          stream.getAudioTracks().forEach(t => { t.enabled = true; });
          stream.getVideoTracks().forEach(t => { t.enabled = true; });
          // Always create a new MediaStream instance so React state change triggers component re-renders
          setRemoteStream(new MediaStream(stream.getTracks()));
        } else {
          setRemoteStream(prev => {
            const tracks = prev ? [...prev.getTracks(), event.track] : [event.track];
            const unique = Array.from(new Map(tracks.map(t => [t.id, t])).values());
            unique.forEach(t => { t.enabled = true; });
            return new MediaStream(unique);
          });
        }
      };

      refreshRemoteStream();

      // Handle track unmuting (when first RTP packets arrive on mobile devices)
      event.track.onunmute = () => {
        console.log(`[WebRTC] Remote ${event.track.kind} track unmuted (media packets flowing)`);
        refreshRemoteStream();
      };

      setConnectionStatus('connected');
    };

    // Handle local ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal_ice', {
          roomId: matchData.roomId,
          to: matchData.peerSocketId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Monitor connection states
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'connecting') {
        setConnectionStatus('connecting');
      } else if (pc.connectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
      } else if (pc.connectionState === 'failed') {
        setConnectionStatus('failed');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
      } else if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE Connection failed, attempting ICE restart...');
        setConnectionStatus('reconnecting');
        if (matchData.isInitiator && typeof pc.restartIce === 'function') {
          try {
            pc.restartIce();
            pc.createOffer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: true })
              .then(async (offer) => {
                await pc.setLocalDescription(offer);
                socket.emit('signal_offer', {
                  roomId: matchData.roomId,
                  to: matchData.peerSocketId,
                  sdp: offer
                });
                console.log('[WebRTC] Sent ICE restart offer.');
              })
              .catch(err => {
                console.error('[WebRTC] ICE restart offer error:', err);
                setConnectionStatus('failed');
              });
          } catch (err) {
            console.error('[WebRTC] Error calling restartIce:', err);
            setConnectionStatus('failed');
          }
        } else {
          setConnectionStatus('failed');
        }
      }
    };

    // If initiator, create offer
    if (matchData.isInitiator) {
      pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
        .then(async (offer) => {
          await pc.setLocalDescription(offer);
          socket.emit('signal_offer', {
            roomId: matchData.roomId,
            to: matchData.peerSocketId,
            sdp: offer
          });
          console.log('[WebRTC] Created and sent SDP Offer with audio/video media sections');
        })
        .catch(err => {
          console.error('[WebRTC] Failed to create offer:', err);
        });
    }

    // Socket signaling listeners
    const handleSignalOffer = async (data: { roomId: string; from: string; sdp: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current || data.roomId !== matchData.roomId) return;
      try {
        console.log('[WebRTC] Received SDP Offer, setting remote description...');
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

        const answer = await peerConnectionRef.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit('signal_answer', {
          roomId: matchData.roomId,
          to: matchData.peerSocketId,
          sdp: answer
        });
        console.log('[WebRTC] Created and sent SDP Answer with audio/video media sections');

        // Flush buffered ICE candidates safely once local and remote descriptions are set
        while (iceCandidatesQueue.current.length > 0) {
          const cand = iceCandidatesQueue.current.shift();
          if (cand) {
            try {
              await peerConnectionRef.current.addIceCandidate(cand);
            } catch (candErr) {
              console.warn('[WebRTC] Buffered candidate note:', candErr);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Error handling signal offer:', err);
      }
    };

    const handleSignalAnswer = async (data: { roomId: string; from: string; sdp: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current || data.roomId !== matchData.roomId) return;
      try {
        console.log('[WebRTC] Received SDP Answer, setting remote description...');
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Flush buffered ICE candidates safely
        while (iceCandidatesQueue.current.length > 0) {
          const cand = iceCandidatesQueue.current.shift();
          if (cand) {
            try {
              await peerConnectionRef.current.addIceCandidate(cand);
            } catch (candErr) {
              console.warn('[WebRTC] Buffered candidate note:', candErr);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Error handling signal answer:', err);
      }
    };

    const handleSignalIce = async (data: { roomId: string; from: string; candidate: RTCIceCandidateInit }) => {
      if (!peerConnectionRef.current || data.roomId !== matchData.roomId || !data.candidate) return;
      try {
        if (peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } else {
          iceCandidatesQueue.current.push(data.candidate);
        }
      } catch (err) {
        console.warn('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    const handleRemoteScreenShareChange = (data: { isSharing: boolean; from: string }) => {
      console.log(`[WebRTC] Remote partner screen share state: ${data.isSharing}`);
      setIsRemoteScreenSharing(data.isSharing);
    };

    const handleRemoteMediaStateChange = (data: { isAudioMuted?: boolean; isVideoDisabled?: boolean; from: string }) => {
      console.log('[WebRTC] Received remote media state change:', data);
      if (typeof data.isAudioMuted === 'boolean') {
        setIsRemoteAudioMuted(data.isAudioMuted);
        if (remoteStream) {
          remoteStream.getAudioTracks().forEach(track => {
            track.enabled = !data.isAudioMuted;
          });
        }
      }
      if (typeof data.isVideoDisabled === 'boolean') {
        setIsRemoteVideoDisabled(data.isVideoDisabled);
        if (remoteStream) {
          remoteStream.getVideoTracks().forEach(track => {
            track.enabled = !data.isVideoDisabled;
          });
        }
      }
    };

    socket.on('signal_offer', handleSignalOffer);
    socket.on('signal_answer', handleSignalAnswer);
    socket.on('signal_ice', handleSignalIce);
    socket.on('remote_screen_share_change', handleRemoteScreenShareChange);
    socket.on('remote_media_state_change', handleRemoteMediaStateChange);

    return () => {
      socket.off('signal_offer', handleSignalOffer);
      socket.off('signal_answer', handleSignalAnswer);
      socket.off('signal_ice', handleSignalIce);
      socket.off('remote_screen_share_change', handleRemoteScreenShareChange);
      socket.off('remote_media_state_change', handleRemoteMediaStateChange);
      cleanupConnection();
    };
  }, [matchData, socket, cleanupConnection]);

  // Synchronize local tracks to peer connection if localStream changes during an active call
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || !localStream || !matchData) return;

    const senders = pc.getSenders();
    let needsRenegotiation = false;

    localStream.getTracks().forEach(track => {
      if (track.kind === 'audio') {
        track.enabled = !isAudioMuted;
      }
      const sender = senders.find(s => s.track && s.track.kind === track.kind);
      if (sender) {
        if (sender.track?.id !== track.id) {
          console.log(`[WebRTC] Updating ${track.kind} track on sender to ${track.id}`);
          sender.replaceTrack(track).catch(err => {
            console.warn(`[WebRTC] Error replacing ${track.kind} track:`, err);
          });
        }
      } else {
        const unusedSender = senders.find(s => !s.track);
        if (unusedSender) {
          unusedSender.replaceTrack(track).catch(() => {});
        } else {
          try {
            console.log(`[WebRTC] Adding new ${track.kind} track to peer connection`);
            pc.addTrack(track, localStream);
            needsRenegotiation = true;
          } catch (err) {
            console.warn(`[WebRTC] Error adding ${track.kind} track:`, err);
          }
        }
      }
    });

    if (needsRenegotiation && socket && pc.signalingState === 'stable') {
      pc.createOffer().then(async (offer) => {
        await pc.setLocalDescription(offer);
        socket.emit('signal_offer', {
          roomId: matchData.roomId,
          to: matchData.peerSocketId,
          sdp: offer
        });
        console.log('[WebRTC] Sent dynamic track renegotiation offer');
      }).catch(err => {
        console.warn('[WebRTC] Dynamic track renegotiation error:', err);
      });
    }
  }, [localStream, matchData, isAudioMuted, socket]);

  // Real-time WebRTC Performance & Voice Communication Statistics (getStats)
  useEffect(() => {
    if (connectionStatus !== 'connected') {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
      return;
    }

    const collectStats = async () => {
      const pc = peerConnectionRef.current;
      if (!pc || pc.connectionState !== 'connected') return;

      try {
        const stats = await pc.getStats();
        let rtt: number | null = null;
        let packetsLost = 0;
        let packetsReceived = 0;
        let audioBytes = 0;
        let videoBytes = 0;
        let resolution: string | null = null;
        let fps: number | null = null;

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && (report.state === 'succeeded' || report.nominated)) {
            if (typeof report.currentRoundTripTime === 'number') {
              rtt = Math.round(report.currentRoundTripTime * 1000);
            }
          }
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            audioBytes = report.bytesReceived || 0;
            if (typeof report.packetsLost === 'number') packetsLost += report.packetsLost;
            if (typeof report.packetsReceived === 'number') packetsReceived += report.packetsReceived;
          }
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoBytes = report.bytesReceived || 0;
            if (typeof report.frameWidth === 'number' && typeof report.frameHeight === 'number') {
              resolution = `${report.frameWidth}x${report.frameHeight}`;
            }
            if (typeof report.framesPerSecond === 'number') {
              fps = Math.round(report.framesPerSecond);
            }
          }
        });

        const now = Date.now();
        let audioBitrate: number | null = null;
        let videoBitrate: number | null = null;
        if (prevStatsRef.current.timestamp > 0) {
          const deltaSec = (now - prevStatsRef.current.timestamp) / 1000;
          if (deltaSec > 0) {
            audioBitrate = Math.max(0, Math.round(((audioBytes - prevStatsRef.current.audioBytes) * 8) / (deltaSec * 1000)));
            videoBitrate = Math.max(0, Math.round(((videoBytes - prevStatsRef.current.videoBytes) * 8) / (deltaSec * 1000)));
          }
        }
        prevStatsRef.current = { timestamp: now, audioBytes, videoBytes };

        const totalPackets = packetsLost + packetsReceived;
        const lossPercent = totalPackets > 0 ? Math.round((packetsLost / totalPackets) * 100 * 10) / 10 : 0;

        let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
        if (rtt !== null) {
          if (rtt < 120 && lossPercent < 2) quality = 'excellent';
          else if (rtt < 260 && lossPercent < 6) quality = 'good';
          else if (rtt < 550 && lossPercent < 15) quality = 'fair';
          else quality = 'poor';
        }

        const localAudioLive = !!localStream?.getAudioTracks().some(t => t.readyState === 'live' && t.enabled);
        const localVideoLive = !!localStream?.getVideoTracks().some(t => t.readyState === 'live' && t.enabled);
        const remoteAudioLive = !!remoteStream?.getAudioTracks().some(t => t.readyState === 'live');
        const remoteVideoLive = !!remoteStream?.getVideoTracks().some(t => t.readyState === 'live');

        setDiagnostics({
          rttMs: rtt,
          packetLossPercent: lossPercent,
          audioBitrateKbps: audioBitrate,
          videoBitrateKbps: videoBitrate,
          videoResolution: resolution,
          fps,
          connectionQuality: quality,
          localAudioTrackLive: localAudioLive,
          localVideoTrackLive: localVideoLive,
          remoteAudioTrackLive: remoteAudioLive,
          remoteVideoTrackLive: remoteVideoLive,
          iceConnectionState: pc.iceConnectionState,
          iceGatheringState: pc.iceGatheringState,
          signalingState: pc.signalingState,
        });
      } catch (err) {
        // Peer connection might be closing
      }
    };

    collectStats();
    statsIntervalRef.current = setInterval(collectStats, 2000);
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    };
  }, [connectionStatus, matchData, localStream, remoteStream]);

  return {
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
    cleanupConnection
  };
}
