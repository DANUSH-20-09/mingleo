import React, { useState } from 'react';
import { ShieldAlert, X, Ban } from 'lucide-react';
import { REPORT_CATEGORIES } from '../config/constants';

interface ReportModalProps {
  isOpen: boolean;
  targetName: string;
  onClose: () => void;
  onSubmitReport: (category: string, details?: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  targetName,
  onClose,
  onSubmitReport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('harassment');
  const [details, setDetails] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedCategory, details);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Report & Block Stranger</h3>
              <p className="text-[11px] text-slate-400">Target: {targetName || 'Current Stranger'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Select Reason for Reporting:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {REPORT_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-rose-950/40 border-rose-500/50 text-white'
                      : 'bg-dark-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportCategory"
                    value={cat.id}
                    checked={selectedCategory === cat.id}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mt-0.5 text-rose-500 focus:ring-rose-500 bg-dark-900"
                  />
                  <div>
                    <div className="font-semibold">{cat.label}</div>
                    <div className="text-[10px] text-slate-400">{cat.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Optional Additional Details:</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context if necessary..."
              maxLength={200}
              rows={2}
              className="w-full bg-dark-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-dark-900/90 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-300">
            <Ban className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Submitting will immediately disconnect, report to safety moderation, and prevent future rematching.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-xs font-bold text-white shadow-lg hover:from-rose-500 hover:to-rose-600 transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report, Block & Skip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
