import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, Zap } from 'lucide-react';
import { MingleoLogo } from './MingleoLogo';

interface MingleoIntroSplashProps {
  onComplete: () => void;
}

export const MingleoIntroSplash: React.FC<MingleoIntroSplashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [statusText, setStatusText] = useState<string>('Initializing peer network...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStatusText('Connecting to live global queues...');
    }, 600);

    const t2 = setTimeout(() => {
      setStatusText('Ready to meet strangers!');
    }, 1200);

    const t3 = setTimeout(() => {
      handleFinish();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleFinish = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b16] text-white overflow-hidden select-none"
        >
          {/* Ambient glowing background orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

          {/* Central Animated Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
            {/* Animated Logo with Ripple Effect */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 blur-xl opacity-50 animate-pulse" />
              <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
                <MingleoLogo size="lg" showText={false} />
              </div>
            </motion.div>

            {/* Title with Glowing Gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl sm:text-5xl font-black tracking-[0.15em] leading-tight mb-2 uppercase"
            >
              <span className="bg-gradient-to-r from-[#00d2ff] via-[#6366f1] to-[#ff007f] bg-clip-text text-transparent drop-shadow-sm">
                Mingleo
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-sm sm:text-base text-slate-300 font-medium tracking-wide mb-6"
            >
              Random Video Chat • Real Human Connections
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-2 mb-8 text-[11px] font-semibold text-slate-300"
            >
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Ultra-Fast WebRTC
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-1.5 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                16+ Languages
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                100% Free & Private
              </span>
            </motion.div>

            {/* Status & Animated Loading Bar */}
            <div className="w-64 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-cyan-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{statusText}</span>
              </div>

              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500"
                />
              </div>
            </div>

            {/* Skip / Enter Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinish}
              className="mt-6 px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all"
            >
              Enter Mingleo Now →
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
