import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  MessageSquare,
  Shield,
  Users,
  Globe,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { WorldMapGraphic } from './WorldMapGraphic';
import { FeatureCards } from './FeatureCards';
import { MingleoVideoPanel } from './MingleoVideoPanel';
import { MingleoChatPanel } from './MingleoChatPanel';
import { MingleoLogo } from './MingleoLogo';
import { APP_NAME, APP_TAGLINE, SUPPORTED_LANGUAGES } from '../config/constants';
import { SupportedLanguage, ChatMessage } from '../types';

interface LandingPageProps {
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isSearching: boolean;
  isConnected: boolean;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  isRemoteAudioMuted?: boolean;
  isRemoteVideoDisabled?: boolean;
  isScreenSharing?: boolean;
  isRemoteScreenSharing?: boolean;
  isScreenShareSupported?: boolean;
  onToggleScreenShare?: () => void;
  strangerName?: string;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onEndCall: () => void;
  onNext: () => void;
  onStartVideoChat: () => void;
  onStartTextChat: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction?: (emoji: string) => void;
  currentUserId: string;
  onOpenGuidelines: () => void;
  onOpenAbout: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  selectedLanguage,
  onSelectLanguage,
  localStream,
  remoteStream,
  isSearching,
  isConnected,
  isAudioMuted,
  isVideoDisabled,
  isRemoteAudioMuted = false,
  isRemoteVideoDisabled = false,
  isScreenSharing = false,
  isRemoteScreenSharing = false,
  isScreenShareSupported = true,
  onToggleScreenShare,
  strangerName = 'Stranger',
  onToggleCam,
  onToggleMic,
  onEndCall,
  onNext,
  onStartVideoChat,
  onStartTextChat,
  messages,
  onSendMessage,
  onSendReaction,
  currentUserId,
  onOpenGuidelines,
  onOpenAbout,
}) => {
  const [isHeroLangOpen, setIsHeroLangOpen] = useState<boolean>(false);
  const heroLangRef = useRef<HTMLDivElement | null>(null);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const featuresRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-x-hidden flex flex-col justify-between">
      {/* 1. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16 flex-1 flex flex-col justify-center">
        {/* World Map Dotted Graphic in Background */}
        <WorldMapGraphic />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          {/* ================= LEFT COLUMN ================= */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 xl:col-span-5 space-y-5 sm:space-y-6 text-left"
          >
            {/* Green Dot Capsule Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Meet strangers from around the world</span>
            </div>

            {/* Brand Title: Mingleo (gradient) + Random Video Chat */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.08]">
                <span className="bg-gradient-to-r from-[#00d2ff] via-[#4d88ff] to-[#f000ff] bg-clip-text text-transparent block drop-shadow-sm">
                  Mingleo
                </span>
                <span className="text-slate-900 dark:text-white block mt-1">
                  Random Video Chat
                </span>
              </h1>
            </div>

            {/* Tagline */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
              One click. A new connection.
            </h2>

            {/* Subtitle Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
              Meet strangers from around the world, make new friends, share cultures, and enjoy real conversations.
            </p>

            {/* Language Preference Selector (Near Start Video Chat) */}
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Match Language:
              </span>
              <div className="relative" ref={heroLangRef}>
                <button
                  type="button"
                  onClick={() => setIsHeroLangOpen(!isHeroLangOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm hover:border-blue-500 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
                  <span>{currentLangObj.name} ({currentLangObj.nativeName})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isHeroLangOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#0c101d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 max-h-60 overflow-y-auto">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Strict Language Queues
                    </div>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onSelectLanguage(lang.code);
                          setIsHeroLangOpen(false);
                        }}
                        className={`w-full px-3.5 py-1.5 text-xs text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          selectedLanguage === lang.code
                            ? 'font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-slate-800/60'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{lang.name}</span>
                        <span className="text-[11px] text-slate-400">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CTA Buttons Row: Start Video Chat & Text Chat */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              {/* Start Video Chat -> Gradient Pill Button */}
              <button
                onClick={onStartVideoChat}
                className="px-6 py-3 rounded-full text-white font-bold text-sm sm:text-base bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-600/30 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 group"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span>Start Video Chat in {currentLangObj.name}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Text Chat -> Outlined Pill Button */}
              <button
                onClick={onStartTextChat}
                className="px-6 py-3 rounded-full font-bold text-sm sm:text-base text-blue-600 dark:text-cyan-300 bg-white dark:bg-slate-900/60 border border-blue-500/50 hover:border-blue-500 dark:border-cyan-500/40 dark:hover:border-cyan-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-cyan-400" />
                <span>Text Chat</span>
              </button>
            </div>

            {/* Trust Badges: 100% Free, Safe & Secure, Global Community */}
            <div className="pt-3 grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-200/80 dark:border-slate-800/80">
              {/* 100% Free */}
              <div className="flex items-start gap-2 sm:gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    100% Free
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    No sign up required
                  </p>
                </div>
              </div>

              {/* Safe & Secure */}
              <div className="flex items-start gap-2 sm:gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Safe & Secure
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    Your privacy matters
                  </p>
                </div>
              </div>

              {/* Global Community */}
              <div className="flex items-start gap-2 sm:gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Global Community
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    Meet people worldwide
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= RIGHT COLUMN: SIDE-BY-SIDE VIDEO & CHAT CARDS ================= */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-7 xl:col-span-7 flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-5"
          >
            {/* Card 1: Video Chat Panel */}
            <MingleoVideoPanel
              localStream={localStream}
              remoteStream={remoteStream}
              isSearching={isSearching}
              isConnected={isConnected}
              isAudioMuted={isAudioMuted}
              isVideoDisabled={isVideoDisabled}
              isRemoteAudioMuted={isRemoteAudioMuted}
              isRemoteVideoDisabled={isRemoteVideoDisabled}
              isScreenSharing={isScreenSharing}
              isRemoteScreenSharing={isRemoteScreenSharing}
              isScreenShareSupported={isScreenShareSupported}
              onToggleScreenShare={onToggleScreenShare}
              strangerName={strangerName}
              selectedLanguageName={currentLangObj.name}
              onToggleCam={onToggleCam}
              onToggleMic={onToggleMic}
              onEndCall={onEndCall}
              onNext={onNext}
              onStartChat={onStartVideoChat}
            />

            {/* Card 2: Chat Panel */}
            <MingleoChatPanel
              messages={messages}
              onSendMessage={onSendMessage}
              onSendReaction={onSendReaction}
              currentUserId={currentUserId}
              isConnected={isConnected}
              isSearching={isSearching}
              strangerName={strangerName}
            />
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURE HIGHLIGHTS SECTION (Below Hero) */}
      <div ref={featuresRef} id="features" className="w-full">
        <FeatureCards />
      </div>

      {/* 3. FOOTER */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 transition-colors duration-300 bg-white/60 dark:bg-[#070b16]/80 backdrop-blur-sm text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MingleoLogo size="sm" />
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-600 dark:text-slate-400">
              © {new Date().getFullYear()} {APP_NAME}. {APP_TAGLINE}
            </span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <button
              onClick={onOpenGuidelines}
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Safety & Guidelines
            </button>
            <button
              onClick={onOpenAbout}
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={onOpenAbout}
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Community Terms
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
