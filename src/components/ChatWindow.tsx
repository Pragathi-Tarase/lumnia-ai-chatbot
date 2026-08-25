import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import { Send, Sparkles, MessageSquare, AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onClearHistory: () => void;
  error: string | null;
}

const SUGGESTIONS = [
  { text: "Write an empathetic apology for a late meeting", label: "Empathetic" },
  { text: "Explain blockchain technology casually in 2 sentences", label: "Casual / Info" },
  { text: "Draft a formal invoice payment reminder", label: "Formal / Transactional" },
  { text: "Share a fun, positive motivational quote", label: "Positive / Emotional" },
];

export default function ChatWindow({
  messages,
  onSendMessage,
  isGenerating,
  onClearHistory,
  error
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Scroll to bottom whenever messages or generating state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Clear query if history is empty
  useEffect(() => {
    if (messages.length === 0) {
      setSearchQuery('');
    }
  }, [messages]);

  const filteredMessages = messages.filter((msg) =>
    msg && typeof msg.text === 'string' && msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl relative" id="chat-window-root">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white font-display tracking-wide uppercase">Lumina Dialog System</h1>
            <p className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">Real-time tone & sentiment analytics</p>
          </div>
        </div>
        {messages.length > 0 && (
          <div className="flex items-center gap-2">
            {showConfirmClear ? (
              <div className="flex items-center gap-1.5 bg-[#21262d] border border-rose-500/30 p-1 rounded-lg">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider px-1.5 font-mono">Purge All?</span>
                <button
                  onClick={() => {
                    onClearHistory();
                    setShowConfirmClear(false);
                  }}
                  className="px-2 py-1 text-[10px] uppercase font-bold tracking-tight bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-2 py-1 text-[10px] uppercase font-bold tracking-tight bg-[#30363d] text-[#8b949e] hover:text-white rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8b949e] hover:text-white transition-colors bg-[#161b22] border border-[#30363d] hover:border-[#8b949e] rounded-lg cursor-pointer animate-fade-in"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Conversation</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      {messages.length > 0 && (
        <div className="px-6 py-3 border-b border-[#30363d] bg-[#161b22]/50 flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8b949e]">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter existing messages by keyword..."
              aria-label="Filter messages"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-2 pl-10 pr-9 text-xs text-white focus:outline-none focus:border-blue-500/50 placeholder-[#8b949e]/50 font-sans transition-colors"
              id="message-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search filter"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8b949e] hover:text-white cursor-pointer"
                id="clear-search-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8b949e] px-2.5 py-1.5 bg-[#21262d] rounded-lg border border-[#30363d] flex-shrink-0 select-none">
            {filteredMessages.length} OF {messages.length} FOUND
          </div>
        </div>
      )}

      {/* Messages area or welcome dashboard */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-[radial-gradient(circle_at_center,_#161b22_0%,_#0d1117_100%)]">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs shadow-md animate-fade-in font-mono">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">API Interaction Error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center py-8">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="text-center max-w-lg px-4 flex flex-col items-center"
            >
              <div className="p-4 bg-[#21262d] rounded-3xl border border-[#30363d] mb-5 relative group">
                <MessageSquare className="w-8 h-8 text-blue-400 relative z-10" />
              </div>
              <h2 className="text-lg font-bold font-display text-white tracking-wide mb-2 uppercase">
                Analytics-Powered Chat
              </h2>
              <p className="text-xs text-[#8b949e] leading-relaxed mb-6 font-sans">
                Initiate dialogues to test real-time sentiment telemetry and automatic response processing. Gemini will answer while generating tone evaluation metadata.
              </p>

              <div className="w-full space-y-3.5">
                <span className="text-[10px] font-black tracking-[0.2em] text-[#8b949e] uppercase block text-left border-b border-[#30363d] pb-1">
                  Test Suggestions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(s.text)}
                      className="text-left text-xs p-3.5 rounded-xl border border-[#30363d] bg-[#161b22]/50 hover:bg-[#161b22] hover:border-blue-500/50 group transition-all duration-300"
                    >
                      <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-blue-400 border border-[#30363d] mb-1.5 inline-block group-hover:border-blue-500/30">
                        {s.label}
                      </span>
                      <p className="text-[#c9d1d9] font-medium group-hover:text-white leading-snug line-clamp-2">
                        "{s.text}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center py-12 text-center text-[#8b949e]">
            <Search className="w-8 h-8 text-[#30363d] mb-3" />
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">No Messages Found</p>
            <p className="text-[11px] text-[#8b949e]/70">No conversation history matched "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMessages.map((message) => (
              <div key={message.id}>
                <MessageBubble message={message} />
              </div>
            ))}

            {/* Typing Indicator */}
            {isGenerating && (
              <div className="flex gap-3.5 items-start py-2.5">
                <div className="flex-shrink-0 flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-[#21262d] border border-[#30363d] shadow-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                </div>
                <div className="bg-[#21262d]/50 text-[#8b949e] rounded-2xl rounded-tl-sm px-5 py-3 border border-[#30363d]/50 flex items-center gap-2.5 shadow-md">
                  <div className="flex space-x-1 items-center">
                    <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 bg-[#8b949e] rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-[12px] text-[#8b949e] ml-1 italic">Analyzing response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="p-5 border-t border-[#30363d] bg-[#0d1117]">
        <form onSubmit={handleSubmit} className="flex gap-3 items-center bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2 focus-within:border-blue-500/50 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGenerating}
            placeholder={isGenerating ? "Analyzing response tags..." : "Message Lumina AI..."}
            aria-label="Message Lumina AI"
            className="flex-1 px-1 py-1.5 text-sm bg-transparent text-white focus:outline-none placeholder-[#8b949e] disabled:opacity-60 transition-all font-sans"
            id="chat-input-field"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            aria-label="Send message"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
            id="chat-submit-btn"
          >
            SEND
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-[#8b949e] mt-2.5 px-1 select-none font-medium">
          <span>POWERED BY GEMINI 3.5 FLASH</span>
          <span>RESPONSE METADATA DETECTED SECURELY</span>
        </div>
      </div>
    </div>
  );
}
