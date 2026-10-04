import { LanguageInfo, VideoQualityPreset } from '../types';

// App Name Configuration - Easily customizable in one place
export const APP_NAME = 'Mingleo';
export const APP_TAGLINE = 'Random Video Chat • One click. A new connection.';

// WebRTC ICE Configuration (STUN & TURN relay servers for Android mobile NAT traversal)
export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
  iceCandidatePoolSize: 0,
};

// Supported Languages with Native Scripts & Info
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', greeting: 'నమస్కారం', description: 'Strict matching with Telugu speakers only' },
  { code: 'english', name: 'English', nativeName: 'English', flag: '🌐', greeting: 'Hello', description: 'Global English speakers worldwide' },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', greeting: 'नमस्ते', description: 'Strict matching with Hindi speakers only' },
  { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', greeting: 'வணக்கம்', description: 'Strict matching with Tamil speakers only' },
  { code: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', greeting: 'ನಮಸ್ಕಾರ', description: 'Strict matching with Kannada speakers only' },
  { code: 'malayalam', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', greeting: 'നമസ്കാരം', description: 'Strict matching with Malayalam speakers only' },
  { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', greeting: 'নমস্কার', description: 'Strict matching with Bengali speakers only' },
  { code: 'marathi', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', greeting: 'नमस्कार', description: 'Strict matching with Marathi speakers only' },
  { code: 'urdu', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', greeting: 'سلام', description: 'Strict matching with Urdu speakers only' },
  { code: 'spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', greeting: '¡Hola!', description: 'Strict matching with Spanish speakers only' },
  { code: 'french', name: 'French', nativeName: 'Français', flag: '🇫🇷', greeting: 'Bonjour', description: 'Strict matching with French speakers only' },
  { code: 'german', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', greeting: 'Hallo', description: 'Strict matching with German speakers only' },
  { code: 'japanese', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', greeting: 'こんにちは', description: 'Strict matching with Japanese speakers only' },
  { code: 'arabic', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', greeting: 'مرحبا', description: 'Strict matching with Arabic speakers only' },
  { code: 'portuguese', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', greeting: 'Olá', description: 'Strict matching with Portuguese speakers only' },
  { code: 'global', name: 'Global (Any)', nativeName: 'Any Language', flag: '🌍', greeting: 'Welcome!', description: 'Match with anyone from around the globe' },
];

export const VIDEO_QUALITY_PRESETS: Record<'720p' | '480p' | '360p', VideoQualityPreset> = {
  '720p': {
    label: 'HD 720p (High Definition)',
    width: 1280,
    height: 720,
    frameRate: 30,
    idealBitrate: 1500000 // 1.5 Mbps
  },
  '480p': {
    label: 'Standard 480p (640x480 Recommended)',
    width: 640,
    height: 480,
    frameRate: 25,
    idealBitrate: 600000 // 600 kbps
  },
  '360p': {
    label: 'Data Saver 360p (480x360 Low Bandwidth)',
    width: 480,
    height: 360,
    frameRate: 20,
    idealBitrate: 350000 // 350 kbps
  }
};

export const QUICK_EMOJIS = ['❤️', '🔥', '😂', '👋', '🎉', '👏', '🚀', '💯'];

export const REPORT_CATEGORIES = [
  { id: 'harassment', label: 'Harassment & Bullying', desc: 'Targeted insults, offensive behavior or persistent annoyance' },
  { id: 'sexual', label: 'Sexual Misconduct & Nudity', desc: 'Inappropriate exposure, soliciting sexual acts, or explicit content' },
  { id: 'abusive_language', label: 'Abusive & Toxic Language', desc: 'Severe swearing, slurs, or toxic remarks' },
  { id: 'threats', label: 'Threats & Violence', desc: 'Threatening physical violence, doxxing, or self-harm incitement' },
  { id: 'spam', label: 'Spam, Bots & Advertising', desc: 'Promoting links, repeated automated behavior or scams' },
  { id: 'other', label: 'Other Guidelines Violation', desc: 'Other behavior violating community safety policies' },
];
