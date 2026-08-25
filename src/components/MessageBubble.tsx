import React from 'react';
import { Message } from '../types';
import { motion } from 'motion/react';
import { Bot, User, Heart, Compass, HelpCircle, CheckCircle2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Sentiment mapping for bot message mini-icon
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
      case 'negative':
        return <Compass className="w-3.5 h-3.5 text-rose-400 rotate-45" />;
      case 'neutral':
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getSentimentBorder = (sentiment?: string) => {
    if (!sentiment) return 'border-[#30363d]';
    switch (sentiment) {
      case 'positive':
        return 'border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.05)]';
      case 'negative':
        return 'border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.05)]';
      case 'neutral':
      default:
        return 'border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.05)]';
    }
  };

  // Formatter for timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex w-full items-start gap-4 py-3 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
      id={`message-${message.id}`}
    >
      {/* Bot Icon Indicator */}
      {!isUser && (
        <div className="flex-shrink-0 flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-[#161b22] border border-[#30363d] shadow-md">
          <Bot className="w-4 h-4 text-blue-400" />
        </div>
      )}

      {/* Message Box */}
      <div className={`flex flex-col max-w-[82%] sm:max-w-[72%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-5 py-3 rounded-2xl text-[14px] leading-relaxed ${
            isUser
              ? 'bg-[#3b82f6] text-white rounded-tr-none shadow-lg'
              : `bg-[#21262d] text-[#e6edf3] rounded-tl-none border ${getSentimentBorder(
                  message.analysis?.sentiment
                )}`
          }`}
        >
          {/* Main message text */}
          <p className="whitespace-pre-wrap select-text">{message.text}</p>
        </div>

        {/* Bubble Meta & Micro telemetry badges */}
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-medium text-[#8b949e] select-none">
          <span>{isUser ? 'You' : 'Lumina AI'}</span>
          <span>•</span>
          <span>{formatTime(message.timestamp)}</span>

          {/* If chatbot message has analysis, show Micro-Telemetry indicators! */}
          {!isUser && message.analysis && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1 bg-[#161b22] leading-none px-1.5 py-0.5 rounded border border-[#30363d]">
                {getSentimentIcon(message.analysis.sentiment)}
                <span className="text-[9px] uppercase tracking-wider text-[#8b949e] font-mono">
                  {message.analysis.sentiment}
                </span>
              </div>
              <div className="flex items-center bg-[#161b22] leading-none px-1.5 py-0.5 rounded border border-[#30363d]">
                <span className="text-[9px] text-blue-400 font-mono">
                  {message.analysis.tone}
                </span>
              </div>
            </>
          )}

          {isUser && (
            <div className="ml-1 text-slate-600">
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* User Icon Indicator */}
      {isUser && (
        <div className="flex-shrink-0 flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-blue-500/10 border border-blue-500/25 shadow-md font-medium">
          <User className="w-4 h-4 text-blue-400" />
        </div>
      )}
    </motion.div>
  );
}
