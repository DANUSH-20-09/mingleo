import React from 'react';
import { Bot } from 'lucide-react';

interface DevModeBannerProps {
  isSimulated: boolean;
}

export const DevModeBanner: React.FC<DevModeBannerProps> = ({ isSimulated }) => {
  if (!isSimulated) return null;

  return (
    <div className="bg-gradient-to-r from-brand-purple/90 via-indigo-900/90 to-brand-cyan/90 border-b border-brand-purple/40 px-4 py-1.5 text-center text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-md">
      <Bot className="w-4 h-4 text-brand-cyan animate-bounce" />
      <span>
        [Dev Mode Active] Connected to an Interactive Simulated Partner for Solo Testing.
      </span>
      <span className="hidden sm:inline-block text-[11px] font-normal text-slate-200">
        • Try Next, Mute, Text Chat, and Reactions!
      </span>
    </div>
  );
};
