import React from 'react';
import { ShieldCheck, X, AlertOctagon, HeartHandshake, EyeOff, Ban } from 'lucide-react';
import { APP_NAME } from '../config/constants';

interface CommunityGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityGuidelinesModal: React.FC<CommunityGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Community Safety Guidelines</h3>
              <p className="text-[11px] text-slate-400">Keeping {APP_NAME} safe, respectful, and fun for all</p>
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
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Zero Tolerance for Nudity & Sexual Harassment</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Displaying explicit sexual content, inappropriate exposure, or soliciting explicit acts is strictly banned. Immediate permanent suspension will apply.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Ban className="w-4 h-4 text-brand-purple" />
              <span>No Hate Speech or Abusive Language</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Insults, threats, and targeted harassment in any language (including Telugu, Hindi, Tamil, and English slangs) will trigger automatic moderation strikes.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <EyeOff className="w-4 h-4 text-brand-cyan" />
              <span>Protect Your Privacy</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Never share phone numbers, bank details, home addresses, or private credentials with strangers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>Be Kind & Respectful</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Every stranger is another human being looking for authentic conversation. Treat everyone with dignity.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
