import React from 'react';
import { Sparkles, X, Lock, Cpu, Globe2, EyeOff } from 'lucide-react';
import { APP_NAME } from '../config/constants';

interface AboutPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutPrivacyModal: React.FC<AboutPrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">About & Privacy Policy</h3>
              <p className="text-[11px] text-slate-400">Understanding data handling & WebRTC security on {APP_NAME}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <EyeOff className="w-4 h-4 text-brand-purple" />
              <span>Zero Video/Audio Recording</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              {APP_NAME} does <strong>not</strong> record, save, or store your video or audio calls. WebRTC streams travel directly between peers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Lock className="w-4 h-4 text-brand-cyan" />
              <span>No Accounts or Phone Numbers Required</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              You join as an anonymous guest with a temporary session ID. No real identities, phone numbers, or email addresses are ever gathered or exposed.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>Strict Server-Side Matchmaking</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Your chosen language (Telugu, English, Hindi, Tamil, etc.) defines an isolated matchmaking queue. Connections are validated server-side to guarantee native language pairings.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Cpu className="w-4 h-4 text-brand-pink" />
              <span>Safety & Multilingual Moderation</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Text chat is screened in real-time for profanity, harassment, and threats across Indian languages and English. Offending users receive strikes and temporary bans.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-cyan hover:bg-brand-cyan/80 font-bold text-dark-950 text-xs transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
