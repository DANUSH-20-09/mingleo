export type SupportedLanguage =
  | 'telugu'
  | 'english'
  | 'hindi'
  | 'tamil'
  | 'kannada'
  | 'malayalam'
  | 'bengali'
  | 'marathi'
  | 'urdu'
  | 'spanish'
  | 'french'
  | 'german'
  | 'japanese'
  | 'arabic'
  | 'portuguese'
  | 'global';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  greeting: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', greeting: 'నమస్కారం' },
  { code: 'english', name: 'English', nativeName: 'English', flag: '🌐', greeting: 'Hello' },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', greeting: 'नमस्ते' },
  { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', greeting: 'வணக்கம்' },
  { code: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', greeting: 'ನಮಸ್ಕಾರ' },
  { code: 'malayalam', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', greeting: 'നമസ്കാരം' },
  { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', greeting: 'নমস্কার' },
  { code: 'marathi', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', greeting: 'नमस्कार' },
  { code: 'urdu', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', greeting: 'سلام' },
  { code: 'spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', greeting: '¡Hola!' },
  { code: 'french', name: 'French', nativeName: 'Français', flag: '🇫🇷', greeting: 'Bonjour' },
  { code: 'german', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', greeting: 'Hallo' },
  { code: 'japanese', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', greeting: 'こんにちは' },
  { code: 'arabic', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', greeting: 'مرحبا' },
  { code: 'portuguese', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', greeting: 'Olá' },
  { code: 'global', name: 'Global (Any)', nativeName: 'Worldwide', flag: '🌍', greeting: 'Hey there!' },
];

export interface UserSession {
  socketId: string;
  guestId: string;
  username: string;
  language: SupportedLanguage;
  joinedQueueAt?: number;
  currentRoomId?: string;
  partnerSocketId?: string;
  state: 'idle' | 'in_queue' | 'connecting' | 'in_call';
  recentPartners: string[]; // Keep recent socket IDs or guest IDs to avoid immediate rematch
  blockedUsers: Set<string>; // guest IDs or socket IDs blocked by this user
  strikeCount: number;
  isBannedUntil?: number;
}

export interface ActiveRoom {
  roomId: string;
  peerA: string; // socketId
  peerB: string; // socketId
  language: SupportedLanguage;
  startedAt: number;
}

export interface ModerationResult {
  isHarmful: boolean;
  category?: 'profanity' | 'harassment' | 'threat' | 'hate_speech' | 'sexual' | 'spam';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  detectedTerms: string[];
  sanitizedText?: string;
  language?: string;
  reason?: string;
}

export interface ReportRecord {
  id: string;
  reporterSocketId: string;
  reporterGuestId: string;
  reportedSocketId: string;
  reportedGuestId: string;
  category: string;
  details?: string;
  language: string;
  timestamp: number;
}
