import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, ShieldAlert } from 'lucide-react';
import { ChatMessage } from '../types';
import { QUICK_EMOJIS } from '../config/constants';
import { quickClientModeration } from '../utils/moderationEngine';

interface MingleoChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction?: (emoji: string) => void;
  currentUserId: string;
  isConnected: boolean;
  isSearching?: boolean;
  strangerName?: string;
}

export const MingleoChatPanel: React.FC<MingleoChatPanelProps> = ({
  messages,
  onSendMessage,
  onSendReaction,
  currentUserId,
  isConnected,
  isSearching: _isSearching,
  strangerName: _strangerName = 'Stranger',
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

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
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
    if (onSendReaction) {
      onSendReaction(emoji);
    }
  };

  // Preview messages matching reference design when no active messages exist
  const sampleMessages = [
    { id: 's1', sender: 'stranger', text: 'Hey! Where are you from?', time: '10:24 PM' },
    { id: 's2', sender: 'me', text: 'Hi there! 👋', time: '10:24 PM' },
    { id: 's3', sender: 'me', text: 'India 🇮🇳', time: '10:25 PM' },
    { id: 's4', sender: 'stranger', text: 'Nice! 👍', time: '10:25 PM' },
  ];

  const hasRealMessages = messages.length > 0;

  return (
    <div className="w-full sm:w-[320px] md:w-[340px] lg:w-[360px] rounded-3xl p-3 sm:p-4 transition-all duration-300 bg-white dark:bg-[#0c101d] border border-slate-200/90 dark:border-slate-800/90 shadow-xl dark:shadow-2xl flex flex-col justify-between text-left h-[520px] sm:h-[550px] md:h-[570px]">
      {/* 1. STATUS HEADER - Matches Reference Image */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            You're now chatting with a random stranger!
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-4 mt-0.5">
          Say hi and start a conversation.
        </p>
      </div>

      {/* 2. MESSAGE STREAM */}
      <div className="flex-1 overflow-y-auto py-3 px-1 space-y-3.5 scrollbar-thin">
        {hasRealMessages ? (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-3.5 py-2 text-xs sm:text-sm max-w-[85%] break-words ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {timeStr}
                </span>
              </div>
            );
          })
        ) : isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-4 space-y-2">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg">
              💬
            </div>
            <p className="text-xs font-medium">Say hello! Type a message or send a friendly wave 👋</p>
          </div>
        ) : (
          /* Visual Replica of Reference Design Conversation */
          sampleMessages.map((item) => {
            const isMe = item.sender === 'me';
            return (
              <div
                key={item.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-3.5 py-2 text-xs sm:text-sm max-w-[85%] break-words font-medium ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {item.text}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                  {item.time}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Safety Warning Banner if typing restricted terms */}
      {localWarning && (
        <div className="mb-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>{localWarning}</span>
        </div>
      )}

      {/* Quick Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="mb-2 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-around gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="text-base sm:text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 3. INPUT ROW - Matches Reference Image */}
      <form onSubmit={handleSend} className="relative flex items-center gap-2 pt-1">
        <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-900/90 rounded-full border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 focus-within:border-blue-500/60 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            maxLength={300}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Add Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
