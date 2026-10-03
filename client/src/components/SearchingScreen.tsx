import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Bot } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../config/constants';

interface SearchingScreenProps {
  selectedLanguage: SupportedLanguage;
  onCancel: () => void;
  onInstantSimulatePartner: () => void;
}

const SEARCH_TIPS = [
  'Strict rule active: You will ONLY be matched with another user who selected the same language.',
  'Be respectful and kind. Harassment or abusive speech triggers automated moderation strikes.',
  'Click "Next" anytime to instantly disconnect and find a new stranger.',
  'Your video and audio streams are end-to-end peer-to-peer via WebRTC.',
  'Use emojis and reactions during calls for expressive interactions.'
];

export const SearchingScreen: React.FC<SearchingScreenProps> = ({
  selectedLanguage,
  onCancel,
  onInstantSimulatePartner
}) => {
  const [tipIndex, setTipIndex] = useState<number>(0);
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % SEARCH_TIPS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto text-center">
      {/* Background ambient radar glow */}
      <div className="absolute w-72 h-72 rounded-full bg-brand-purple/20 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute w-72 h-72 rounded-full bg-brand-cyan/20 blur-[100px] pointer-events-none -z-10" />

      {/* Main Radar / Orb Animation */}
      <div className="relative w-64 h-64 flex items-center justify-center my-6">
        {/* Outer Pulsing Rings */}
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border border-brand-purple/40"
        />
        <motion.div
          animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0.05, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="absolute inset-0 rounded-full border border-brand-cyan/30"
        />

        {/* Radar Scanner Sweep Line */}
        <div className="absolute inset-2 rounded-full border border-dashed border-slate-700/80 overflow-hidden">
          <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(6,182,212,0.4)_360deg)] animate-radar-sweep rounded-full" />
        </div>

        {/* Center Orb Icon */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan p-1 shadow-glow-cyan flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-dark-950 flex flex-col items-center justify-center">
            <span className="text-3xl">{currentLangObj.flag}</span>
            <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider mt-1">
              {currentLangObj.code}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Status Copy */}
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <span>Finding {currentLangObj.name} speakers...</span>
          <span className="inline-block w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
        </h2>
        <p className="text-xs text-slate-400">
          Strict matchmaking is scanning for available <strong>{currentLangObj.name} ({currentLangObj.nativeName})</strong> users in your queue.
        </p>
      </div>

      {/* Tip Box Carousel */}
      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-6 p-3.5 rounded-xl glass-panel border border-slate-800 text-xs text-slate-300 max-w-md flex items-center gap-2.5 text-left"
      >
        <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
        <span className="line-clamp-2">{SEARCH_TIPS[tipIndex]}</span>
      </motion.div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          onClick={onCancel}
          className="w-full py-3 px-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4 text-rose-400" />
          <span>Cancel Search</span>
        </button>

        {/* Solo Developer / Reviewer instant simulator */}
        <button
          onClick={onInstantSimulatePartner}
          className="w-full py-3 px-5 rounded-xl bg-brand-purple/20 border border-brand-purple/40 text-brand-purple hover:bg-brand-purple/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
          title="Connect with interactive simulated partner in Dev Mode"
        >
          <Bot className="w-4 h-4 text-brand-cyan" />
          <span>Simulated Partner (Dev)</span>
        </button>
      </div>
    </div>
  );
};
