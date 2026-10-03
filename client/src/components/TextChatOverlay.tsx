import React, { useState, useRef, useEffect } from 'react';
import { Send, X, ShieldAlert, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { QUICK_EMOJIS } from '../config/constants';
import { quickClientModeration } from '../utils/moderationEngine';

interface TextChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  currentUserId: string;
}

export const TextChatOverlay: React.FC<TextChatOverlayProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onSendReaction,
  currentUserId,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Live pre-flight check
    const check = quickClientModeration(val);
    if (!check.isClean) {
      setLocalWarning(`Inappropriate term detected ("${check.flaggedWord}"). Harassing language is not allowed.`);
    } else {
      setLocalWarning(null);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText('');
    setLocalWarning(null);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-80 md:w-96 glass-panel border-l border-slate-800 flex flex-col shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-dark-900/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live In-Call Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600" />
            <p className="text-xs font-medium">Say hello! Break the ice or send an emoji reaction.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                  <span className="font-semibold">{isMe ? 'You' : msg.senderName}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                    isMe
                      ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white rounded-br-none shadow-glow-purple'
                      : 'bg-dark-800/90 text-slate-100 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* In-flight toxic warning banner */}
      {localWarning && (
        <div className="mx-3 mb-2 p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{localWarning}</span>
        </div>
      )}

      {/* Quick Reaction Row */}
      <div className="px-3 py-2 border-t border-slate-800/60 flex items-center justify-around bg-dark-950/40">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="hover:scale-130 active:scale-95 transition-transform text-lg p-1 rounded hover:bg-slate-800/60"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-dark-900/90 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a friendly message..."
          maxLength={300}
          className="flex-1 bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
