import React from 'react';
import { AnalysisData, Message } from '../types';
import { Sparkles, TrendingUp, BarChart3, Activity, Info, ShieldAlert, Heart, MessageSquareDot } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalysisPanelProps {
  currentAnalysis: AnalysisData | null;
  history: Message[];
}

export default function AnalysisPanel({ currentAnalysis, history }: AnalysisPanelProps) {
  // Aggregate stats from history for historical metrics
  const botMessages = history.filter((m) => m && m.role === 'model' && m.analysis);
  const totalBots = botMessages.length;

  const sentimentStats: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
  const intentStats: Record<string, number> = { informational: 0, emotional: 0, transactional: 0 };
  const toneStats: Record<string, number> = { formal: 0, casual: 0, empathetic: 0 };
  let avgConfidence = 0;
  let avgLatencyMs: number | null = null;

  if (totalBots > 0) {
    let confidenceSum = 0;
    let latencySum = 0;
    let latencyCount = 0;
    botMessages.forEach((msg) => {
      const a = msg.analysis;
      if (a) {
        if (a.sentiment) sentimentStats[a.sentiment] = (sentimentStats[a.sentiment] || 0) + 1;
        if (a.intent) intentStats[a.intent] = (intentStats[a.intent] || 0) + 1;
        if (a.tone) toneStats[a.tone] = (toneStats[a.tone] || 0) + 1;
        confidenceSum += typeof a.confidence === 'number' ? a.confidence : 0;
      }
      if (typeof msg.latencyMs === 'number') {
        latencySum += msg.latencyMs;
        latencyCount++;
      }
    });
    avgConfidence = confidenceSum / totalBots;
    if (latencyCount > 0) {
      avgLatencyMs = Math.round(latencySum / latencyCount);
    }
  }

  // Sentiment colors
  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15';
      case 'neutral':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15';
    }
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl" id="analysis-panel-root">
      {/* Panel Header */}
      <div className="px-6 py-4.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 px-1.5 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <h2 className="text-sm font-bold tracking-wide uppercase text-white font-display">
            RESPONSE ANALYSIS
          </h2>
        </div>
        {currentAnalysis && (
          <span className="text-[9px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300">
            LIVE FEED
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-7">
        {/* CURRENT RESPONSE ANALYSIS */}
        <div>
          <h3 className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.2em] mb-4 border-b border-[#30363d] pb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Latest Response Telemetry</span>
          </h3>

          {currentAnalysis ? (
            <div className="space-y-6">
              {/* Badges Grid */}
              <div className="space-y-4">
                {/* Sentiment */}
                <div className="flex flex-col">
                  <label className="text-[11px] text-[#8b949e] block mb-2 font-medium">SENTIMENT</label>
                  <div className="flex">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase border transition-all duration-300 ${getSentimentStyles(currentAnalysis.sentiment)}`}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
                      {capitalize(currentAnalysis.sentiment)}
                    </span>
                  </div>
                </div>

                {/* Intent */}
                <div className="flex flex-col">
                  <label className="text-[11px] text-[#8b949e] block mb-2 font-medium">INTENT</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {capitalize(currentAnalysis.intent)}
                    </span>
                  </div>
                </div>

                {/* Tone */}
                <div className="flex flex-col">
                  <label className="text-[11px] text-[#8b949e] block mb-2 font-medium">TONE</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {capitalize(currentAnalysis.tone)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Meter */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[11px] text-[#8b949e] font-medium">CONFIDENCE</label>
                  <span className="text-[11px] font-bold text-white uppercase">{(currentAnalysis.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentAnalysis.confidence * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-[#161b22]/40 rounded-xl border border-dashed border-[#30363d] flex flex-col items-center justify-center space-y-2">
              <MessageSquareDot className="w-8 h-8 text-[#30363d] animate-bounce" />
              <p className="text-xs text-[#8b949e] italic">Waiting for first bot reply...</p>
              <p className="text-[10px] text-[#8b949e]/60 max-w-xs leading-normal">
                Dialogue metrics engine will calculate indicators, tones, and intent parameters instantly and visually.
              </p>
            </div>
          )}
        </div>

        {/* DIALOGUE HISTORICAL SUMMARY */}
        <div className="pt-4 border-t border-[#30363d]">
          <h3 className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.2em] mb-4 border-b border-[#30363d] pb-2 flex items-center space-x-1.5">
            <BarChart3 className="w-3 h-3 text-blue-400" />
            <span>Dialogue Summary ({totalBots})</span>
          </h3>

          {totalBots > 0 ? (
            <div className="space-y-4">
              {/* Sentiment Distribution */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Sentiment Distribution</span>
                <div className="h-2 flex rounded-full overflow-hidden bg-[#21262d]">
                  {['positive', 'neutral', 'negative'].map((sent) => {
                    const count = (sentimentStats as any)[sent] || 0;
                    const pct = totalBots > 0 ? (count / totalBots) * 100 : 0;
                    if (pct === 0) return null;
                    const colors = 
                      sent === 'positive' ? 'bg-emerald-500' :
                      sent === 'negative' ? 'bg-rose-500' :
                      'bg-amber-500';
                    return (
                      <div
                        key={sent}
                        style={{ width: `${pct}%` }}
                        className={`${colors} h-full transition-all duration-300`}
                        title={`${sent}: ${count}`}
                      />
                    );
                  })}
                </div>
                {/* Labels Legend */}
                <div className="flex justify-between items-center text-[10px] text-[#8b949e] font-semibold tracking-wider font-mono">
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>POS ({sentimentStats.positive})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    <span>NEU ({sentimentStats.neutral})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    <span>NEG ({sentimentStats.negative})</span>
                  </div>
                </div>
              </div>

              {/* Intent breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Dominant Intent Profiling</span>
                <div className="space-y-2">
                  {Object.entries(intentStats).map(([intent, val]) => {
                    const pct = totalBots > 0 ? (val / totalBots) * 100 : 0;
                    return (
                      <div key={intent} className="space-y-1">
                        <div className="flex justify-between text-[10px] text-[#8b949e] font-bold uppercase tracking-wider font-mono">
                          <span>{intent}</span>
                          <span className="text-white">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-[#21262d] rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%` }} className="bg-blue-500 h-full rounded-full transition-all duration-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#161b22]/20 p-4 rounded-xl border border-[#30363d]/50 text-center">
              <span className="text-[10px] text-[#8b949e] font-medium leading-normal block">
                Historical metrics will compile transaction and flow profiles as dialogue history records are computed.
              </span>
            </div>
          )}
        </div>

        {/* SYSTEM METRICS */}
        <div className="mt-auto pt-4 border-t border-[#30363d]">
          <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
            <h3 className="text-[10px] text-[#8b949e] font-bold mb-3 uppercase tracking-widest">System Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] text-blue-400 font-bold uppercase font-mono">Response Latency</span>
                <span className="text-sm text-white font-mono font-semibold">
                  {avgLatencyMs !== null ? `${avgLatencyMs}ms` : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-blue-400 font-bold uppercase font-mono">Confidence Level</span>
                <span className="text-sm text-white font-mono font-semibold">
                  {totalBots > 0 ? `${(avgConfidence * 100).toFixed(0)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
