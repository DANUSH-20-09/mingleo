import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';
import { ModerationWarning } from '../types';

interface ToastProps {
  warning: ModerationWarning | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ warning, onDismiss }) => {
  if (!warning) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="p-4 rounded-2xl bg-rose-950/95 border-2 border-rose-500 shadow-2xl backdrop-blur-xl text-white space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Moderation Warning (Strike {warning.strikeCount}/3)</span>
            </div>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-rose-900/40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-rose-100 leading-relaxed font-medium">
            {warning.reason || 'Potentially harmful or abusive language was detected.'}
          </p>

          {warning.detectedTerms && warning.detectedTerms.length > 0 && (
            <div className="text-[11px] text-rose-300/90 bg-rose-900/40 px-2.5 py-1 rounded-lg border border-rose-800">
              Flagged term: <strong>{warning.detectedTerms.join(', ')}</strong>
            </div>
          )}

          {warning.isBanned && (
            <div className="text-xs font-bold text-yellow-300 bg-yellow-950/60 p-2 rounded-xl border border-yellow-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Temporary cooldown activated due to multiple strikes.</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
