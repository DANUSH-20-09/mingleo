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
  startSearch: () => void;
  cancelSearch: () => void;
  nextMatch: (requeue?: boolean) => void;
  endCall: () => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  reportCurrentPartner: (category: string, details?: string) => void;
  blockCurrentPartner: () => void;
  onlineStats: { activeSessionsCount: number; activeRoomsCount: number } | null;
  onlineCount: number;
  activeChattingCount: number;
  inQueueCount: number;
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
    let id = sessionStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(GUEST_ID_KEY, id);
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
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [activeChattingCount, setActiveChattingCount] = useState<number>(0);
  const [inQueueCount, setInQueueCount] = useState<number>(0);

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
    // Determine backend URL (custom configured URL, direct port 5001 in dev/local network, or origin in prod)
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.hostname.startsWith('10.') ||
                    window.location.hostname.endsWith('.local');

    const serverUrl = serverUrlState || (import.meta as any).env?.VITE_SERVER_URL ||
      (isLocal && (window.location.port === '5173' || window.location.port === '4173')
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
      setOnlineCount(1);
      setActiveChattingCount(0);
      setInQueueCount(0);
      console.log('[Socket] Disconnected from signaling server.');
    });

    socketInstance.on('user_count_update', (data: {
      totalOnline?: number;
      activeChatting?: number;
      activeRooms?: number;
      inQueue?: number;
    }) => {
      if (typeof data.totalOnline === 'number') {
        setOnlineCount(Math.max(1, data.totalOnline));
      }
      if (typeof data.activeChatting === 'number') {
        setActiveChattingCount(data.activeChatting);
      }
      if (typeof data.inQueue === 'number') {
        setInQueueCount(data.inQueue);
      }
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
      // Seamless Omegle-style continuous matching: automatically find next stranger!
      setIsSearching(true);
      if (socketInstance.connected) {
        socketInstance.emit('join_queue', {
          guestId,
          username,
          language: selectedLanguage
        });
      }
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
    const apiBase = (isLocal && (window.location.port === '5173' || window.location.port === '4173'))
      ? `http://${window.location.hostname}:5001`
      : (serverUrlState || '');
    if (apiBase) {
      fetch(`${apiBase}/api/stats`)
        .then(res => res.json())
        .then(data => {
          if (data.stats) {
            setOnlineStats(data.stats);
            if (typeof data.stats.totalOnline === 'number') {
              setOnlineCount(Math.max(1, data.stats.totalOnline));
            }
            if (typeof data.stats.activeChatting === 'number') {
              setActiveChattingCount(data.stats.activeChatting);
            }
            if (typeof data.stats.inQueue === 'number') {
              setInQueueCount(data.stats.inQueue);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      socketInstance.disconnect();
    };
  }, [guestId, serverUrlState]);

  const startSearch = () => {
    setMatchData(null);
    setMessages([]);
    setIsSearching(true);

    if (socketRef.current) {
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      socketRef.current.emit('join_queue', {
        guestId,
        username,
        language: selectedLanguage,
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
    const roomId = matchData?.roomId;
    setMatchData(null);
    setMessages([]);

    if (requeue) {
      setIsSearching(true);
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('next_partner', { roomId, requeue });
    } else if (requeue) {
      startSearch();
    }
  };

  const endCall = () => {
    SoundEffects.playSkipSound();
    const roomId = matchData?.roomId;
    setMatchData(null);
    setIsSearching(false);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('end_call', { roomId });
      socketRef.current.emit('leave_queue');
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    if (!socketRef.current || !matchData) return;
    socketRef.current.emit('chat_message', {
      roomId: matchData.roomId,
      text: text.trim()
    });
  };

  const sendReaction = (emoji: string) => {
    setLastReaction({ emoji, id: `${Date.now()}_self` });
    SoundEffects.playReactionSound();
    if (socketRef.current && matchData) {
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
        onlineCount,
        activeChattingCount,
        inQueueCount,
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
