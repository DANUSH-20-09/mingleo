import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SupportedLanguage, ChatMessage, ModerationWarning } from '../types';
import { useSafety } from './SafetyContext';
import { SoundEffects } from '../utils/soundEffects';

interface MatchData {
  roomId: string;
  peerSocketId: string;
  peerName: string;
  isInitiator: boolean;
  language: SupportedLanguage;
  isSimulated?: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  guestId: string;
  username: string;
  setUsername: (name: string) => void;
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (lang: SupportedLanguage) => void;
  isSearching: boolean;
  matchData: MatchData | null;
  messages: ChatMessage[];
  lastReaction: { emoji: string; id: string } | null;
  startSearch: (wantsSimulation?: boolean) => void;
  cancelSearch: () => void;
  nextMatch: (requeue?: boolean) => void;
  endCall: () => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  reportCurrentPartner: (category: string, details?: string) => void;
  blockCurrentPartner: () => void;
  onlineStats: { activeSessionsCount: number; activeRoomsCount: number } | null;
  serverUrl: string;
  setServerUrl: (url: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const GUEST_ID_KEY = 'vibeconnect_guest_id';
const USERNAME_KEY = 'vibeconnect_username';
const LANGUAGE_KEY = 'vibeconnect_pref_lang';
const SERVER_URL_KEY = 'vibeconnect_server_url';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setWarning, blockUser } = useSafety();

  const [guestId] = useState<string>(() => {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  });

  const [username, setUsernameState] = useState<string>(() => {
    return localStorage.getItem(USERNAME_KEY) || `Viber_${Math.floor(1000 + Math.random() * 9000)}`;
  });

  const [selectedLanguage, setSelectedLanguageState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem(LANGUAGE_KEY) as SupportedLanguage) || 'telugu';
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastReaction, setLastReaction] = useState<{ emoji: string; id: string } | null>(null);
  const [onlineStats, setOnlineStats] = useState<{ activeSessionsCount: number; activeRoomsCount: number } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const setUsername = (name: string) => {
    setUsernameState(name);
    localStorage.setItem(USERNAME_KEY, name);
  };

  const setSelectedLanguage = (lang: SupportedLanguage) => {
    setSelectedLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  };

  const [serverUrlState, setServerUrlState] = useState<string>(() => {
    return localStorage.getItem(SERVER_URL_KEY) || (import.meta as any).env?.VITE_SERVER_URL || '';
  });

  const setServerUrl = (url: string) => {
    setServerUrlState(url);
    if (url.trim()) {
      localStorage.setItem(SERVER_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(SERVER_URL_KEY);
    }
    window.location.reload();
  };

  useEffect(() => {
    // Determine backend URL (custom configured URL, direct port 5001 in dev, or origin in prod)
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const serverUrl = serverUrlState || (import.meta as any).env?.VITE_SERVER_URL ||
      (isLocalDev && window.location.port === '5173'
        ? `http://${window.location.hostname}:5001`
        : window.location.origin);

    const socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 8000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to VibeConnect signaling server at', serverUrl);
      socketInstance.emit('register', {
        guestId,
        username,
        language: selectedLanguage
      });
    });

    socketInstance.on('connect_error', (err) => {
      setIsConnected(false);
      console.warn('[Socket] Connection failed to signaling server at', serverUrl, err.message);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsSearching(false);
      setMatchData(null);
      console.log('[Socket] Disconnected from signaling server.');
    });

    socketInstance.on('reconnect', () => {
      setIsConnected(true);
      console.log('[Socket] Reconnected to signaling server.');
      socketInstance.emit('register', {
        guestId,
        username,
        language: selectedLanguage
      });
    });

    socketInstance.on('queue_joined', (data: { language: SupportedLanguage }) => {
      setIsSearching(true);
      console.log(`[Socket] In strict queue for ${data.language}`);
    });

    socketInstance.on('queue_left', () => {
      setIsSearching(false);
    });

    socketInstance.on('matched', (data: MatchData) => {
      console.log('[Socket] Matched with stranger:', data);
      setIsSearching(false);
      setMatchData(data);
      setMessages([]);
      SoundEffects.playMatchSound();
    });

    socketInstance.on('partner_disconnected', (data: { roomId: string; reason: string }) => {
      console.log('[Socket] Partner disconnected:', data.reason);
      SoundEffects.playSkipSound();
      setMatchData(null);
    });

    socketInstance.on('chat_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (msg.senderId !== socketInstance.id) {
        SoundEffects.playMessageSound();
      }
    });

    socketInstance.on('receive_reaction', (data: { emoji: string; from: string }) => {
      setLastReaction({ emoji: data.emoji, id: `${Date.now()}_${Math.random()}` });
      SoundEffects.playReactionSound();
    });

    socketInstance.on('moderation_warning', (warning: ModerationWarning) => {
      setWarning(warning);
    });

    socketInstance.on('match_error', (data: { message: string }) => {
      setIsSearching(false);
      alert(data.message);
    });

    // Fetch initial server stats
    const apiBase = (isLocalDev && window.location.port === '5173')
      ? `http://${window.location.hostname}:5001`
      : (serverUrlState || '');
    if (apiBase) {
      fetch(`${apiBase}/api/stats`)
        .then(res => res.json())
        .then(data => {
          if (data.stats) {
            setOnlineStats(data.stats);
          }
        })
        .catch(() => {});
    }

    return () => {
      socketInstance.disconnect();
    };
  }, [guestId, serverUrlState]);

  const startSearch = (wantsSimulation: boolean = false) => {
    setMatchData(null);
    setMessages([]);
    setIsSearching(true);

    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSocketReady = socketRef.current && socketRef.current.connected;

    // If explicitly requested OR if backend is unreachable (e.g. on Netlify before backend is hosted)
    if (wantsSimulation || (!isSocketReady && !isLocalDev)) {
      console.log('[Socket] Launching standalone demo match...');
      setTimeout(() => {
        setIsSearching(false);
        const simData: MatchData = {
          roomId: `sim_${Date.now()}`,
          peerSocketId: `sim_stranger_${Date.now()}`,
          peerName: 'Stranger (Demo)',
          isInitiator: true,
          language: selectedLanguage,
          isSimulated: true
        };
        setMatchData(simData);
        SoundEffects.playMatchSound();
      }, 1000);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('join_queue', {
        guestId,
        username,
        language: selectedLanguage,
        wantsSimulation
      });
    }
  };

  const cancelSearch = () => {
    setIsSearching(false);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_queue');
    }
  };

  const nextMatch = (requeue: boolean = true) => {
    SoundEffects.playSkipSound();
    const wasSimulated = matchData?.isSimulated;
    const roomId = matchData?.roomId;
    setMatchData(null);
    setMessages([]);

    if (wasSimulated) {
      if (requeue) {
        startSearch(true);
      }
      return;
    }

    if (requeue) {
      setIsSearching(true);
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('next_partner', { roomId, requeue });
    } else if (requeue) {
      startSearch(true);
    }
  };

  const endCall = () => {
    SoundEffects.playSkipSound();
    const wasSimulated = matchData?.isSimulated;
    const roomId = matchData?.roomId;
    setMatchData(null);
    setIsSearching(false);
    if (!wasSimulated && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('end_call', { roomId });
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    if (matchData?.isSimulated) {
      const selfMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId: guestId,
        senderName: username,
        text: text.trim(),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, selfMsg]);

      // Friendly automated demo conversation response
      setTimeout(() => {
        const demoResponses = [
          "Hello! Nice to meet you 😊",
          "Hey! Greetings from across the world! 👋",
          "Haha yes! How is your day going? ✨",
          "That's awesome! Glad we connected here on Mingleo! 🚀",
          "What kind of music or hobbies do you enjoy? 🎨"
        ];
        const randomReply = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        const replyMsg: ChatMessage = {
          id: `msg_sim_${Date.now()}`,
          senderId: 'sim_stranger',
          senderName: 'Stranger (Demo)',
          text: randomReply,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, replyMsg]);
        SoundEffects.playMessageSound();
      }, 1200);
      return;
    }

    if (!socketRef.current || !matchData) return;
    socketRef.current.emit('chat_message', {
      roomId: matchData.roomId,
      text: text.trim()
    });
  };

  const sendReaction = (emoji: string) => {
    setLastReaction({ emoji, id: `${Date.now()}_self` });
    SoundEffects.playReactionSound();
    if (socketRef.current && matchData && !matchData.isSimulated) {
      socketRef.current.emit('send_reaction', {
        roomId: matchData.roomId,
        emoji
      });
    }
  };

  const reportCurrentPartner = (category: string, details?: string) => {
    if (!socketRef.current || !matchData) return;
    socketRef.current.emit('report_user', {
      reportedSocketId: matchData.peerSocketId,
      category,
      details,
      language: selectedLanguage
    });
    blockUser(matchData.peerSocketId);
    nextMatch(true);
  };

  const blockCurrentPartner = () => {
    if (!socketRef.current || !matchData) return;
    blockUser(matchData.peerSocketId);
    socketRef.current.emit('block_user', {
      blockedSocketId: matchData.peerSocketId
    });
    nextMatch(true);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        guestId,
        username,
        setUsername,
        selectedLanguage,
        setSelectedLanguage,
        isSearching,
        matchData,
        messages,
        lastReaction,
        startSearch,
        cancelSearch,
        nextMatch,
        endCall,
        sendMessage,
        sendReaction,
        reportCurrentPartner,
        blockCurrentPartner,
        onlineStats,
        serverUrl: serverUrlState,
        setServerUrl
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
