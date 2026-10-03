import React, { createContext, useContext, useState, useEffect } from 'react';
import { ModerationWarning } from '../types';
import { SoundEffects } from '../utils/soundEffects';

interface SafetyContextType {
  strikes: number;
  isBanned: boolean;
  bannedUntil?: number;
  blockedUsers: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
  hasAgreedToGuidelines: boolean;
  agreeToGuidelines: () => void;
  activeWarning: ModerationWarning | null;
  clearWarning: () => void;
  setWarning: (warning: ModerationWarning) => void;
  isReportModalOpen: boolean;
  reportTarget: { socketId: string; name: string } | null;
  openReportModal: (socketId: string, name: string) => void;
  closeReportModal: () => void;
}

const SafetyContext = createContext<SafetyContextType | null>(null);

const BLOCKED_USERS_STORAGE_KEY = 'vibeconnect_blocked_users';
const GUIDELINES_STORAGE_KEY = 'vibeconnect_guidelines_agreed';

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [strikes, setStrikes] = useState<number>(0);
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [bannedUntil, setBannedUntil] = useState<number | undefined>(undefined);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [hasAgreedToGuidelines, setHasAgreedToGuidelines] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GUIDELINES_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [activeWarning, setActiveWarning] = useState<ModerationWarning | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportTarget, setReportTarget] = useState<{ socketId: string; name: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(blockedUsers));
    } catch {}
  }, [blockedUsers]);

  const blockUser = (userId: string) => {
    if (!userId) return;
    setBlockedUsers(prev => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const unblockUser = (userId: string) => {
    setBlockedUsers(prev => prev.filter(id => id !== userId));
  };

  const isUserBlocked = (userId: string) => {
    return blockedUsers.includes(userId);
  };

  const agreeToGuidelines = () => {
    setHasAgreedToGuidelines(true);
    try {
      localStorage.setItem(GUIDELINES_STORAGE_KEY, 'true');
    } catch {}
  };

  const setWarning = (warning: ModerationWarning) => {
    setActiveWarning(warning);
    setStrikes(warning.strikeCount);
    if (warning.isBanned) {
      setIsBanned(true);
      setBannedUntil(warning.bannedUntil);
    }
    SoundEffects.playWarningSound();
  };

  const clearWarning = () => {
    setActiveWarning(null);
  };

  const openReportModal = (socketId: string, name: string) => {
    setReportTarget({ socketId, name });
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportTarget(null);
  };

  return (
    <SafetyContext.Provider
      value={{
        strikes,
        isBanned,
        bannedUntil,
        blockedUsers,
        blockUser,
        unblockUser,
        isUserBlocked,
        hasAgreedToGuidelines,
        agreeToGuidelines,
        activeWarning,
        clearWarning,
        setWarning,
        isReportModalOpen,
        reportTarget,
        openReportModal,
        closeReportModal,
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
};
