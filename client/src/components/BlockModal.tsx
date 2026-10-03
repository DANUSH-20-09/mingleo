import React from 'react';
import { UserX, Ban } from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  targetName: string;
  onClose: () => void;
  onConfirmBlock: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  targetName,
  onClose,
  onConfirmBlock,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
          <UserX className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Block This Stranger?</h3>
          <p className="text-xs text-slate-400">
            You will disconnect immediately and never be rematched with <strong>{targetName || 'this user'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmBlock();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Block & Next</span>
          </button>
        </div>
      </div>
    </div>
  );
};
