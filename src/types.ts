export type SentimentType = 'positive' | 'neutral' | 'negative';
export type IntentType = 'informational' | 'emotional' | 'transactional';
export type ToneType = 'formal' | 'casual' | 'empathetic';

export interface AnalysisData {
  sentiment: SentimentType;
  intent: IntentType;
  tone: ToneType;
  confidence: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  analysis?: AnalysisData;
  latencyMs?: number;
}
