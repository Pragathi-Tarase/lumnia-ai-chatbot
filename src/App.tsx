import React, { useState, useEffect } from 'react';
import { Message, AnalysisData } from './types';
import ChatWindow from './components/ChatWindow';
import AnalysisPanel from './components/AnalysisPanel';
import AuthScreen from './components/AuthScreen';
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  db,
  handleFirestoreError,
  OperationType,
  FirebaseUser
} from './firebase';
import { Brain, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Synchronise authentication session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch historical user chat messages from firestore
          const q = query(
            collection(db, 'users', firebaseUser.uid, 'messages'),
            orderBy('timestamp', 'asc')
          );
          const snapshot = await getDocs(q);
          const loadedMessages: Message[] = [];
          snapshot.forEach((snapDoc) => {
            loadedMessages.push(snapDoc.data() as Message);
          });
          setMessages(loadedMessages);

          // Find and fill latest bot analysis parameter
          const modelMsgsWithAnalysis = loadedMessages.filter((m: any) => m && m.role === 'model' && m.analysis);
          if (modelMsgsWithAnalysis.length > 0) {
            setCurrentAnalysis(modelMsgsWithAnalysis[modelMsgsWithAnalysis.length - 1].analysis);
          } else {
            setCurrentAnalysis(null);
          }
        } catch (err: any) {
          console.error('Failed to load chat records on auth mounting:', err);
          setError(err.message || 'Failed to sync historical conversation segments.');
        }
      } else {
        // Clear state if session is terminated
        setMessages([]);
        setCurrentAnalysis(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (isGenerating || !currentUser) return;

    setError(null);
    setIsGenerating(true);

    try {
      // 1. Prepare user message doc inside subcollection
      const msgCol = collection(db, 'users', currentUser.uid, 'messages');
      const msgDoc = doc(msgCol);
      const userMessageId = msgDoc.id;

      const newUserMessage: Message = {
        id: userMessageId,
        role: 'user',
        text,
        timestamp: new Date().toISOString()
      };

      // Save user input securely to Firestore
      await setDoc(msgDoc, newUserMessage);

      // Instantly render local user node bubble
      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);

      // 2. Fetch processed response and dynamic tone evaluation from backend AI agent proxy
      const startTime = performance.now();
      const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: messages
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const measuredLatency = typeof data.latency_ms === 'number' ? data.latency_ms : Math.round(endTime - startTime);

      // 3. Prepare AI reply doc inside subcollection
      const botMsgCol = collection(db, 'users', currentUser.uid, 'messages');
      const botMsgDoc = doc(botMsgCol);
      const botMessageId = botMsgDoc.id;

      const newBotMessage: Message = {
        id: botMessageId,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toISOString(),
        analysis: data.analysis,
        latencyMs: measuredLatency
      };

      // Save bot reply securely to Firestore
      await setDoc(botMsgDoc, newBotMessage);

      // Update local message chain and current telemetry analytics views
      setMessages((prev) => [...prev, newBotMessage]);
      setCurrentAnalysis(data.analysis || null);

    } catch (err: any) {
      console.error('Core transaction failed:', err);
      setError(err.message || 'Unable to store message history or obtain AI response telemetry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = async () => {
    if (!currentUser) return;

    setError(null);
    try {
      const qSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'messages'));
      for (const d of qSnapshot.docs) {
        await deleteDoc(d.ref);
      }
      setMessages([]);
      setCurrentAnalysis(null);
    } catch (err: any) {
      console.error('Purging historical data failed:', err);
      setError('Failed to purge conversation segments from cloud database: ' + (err.message || String(err)));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Session clearance failure:', err);
    }
  };

  // Intermediary loader screen for high professional responsiveness
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-white p-4 font-sans select-none relative overflow-hidden" id="loader-view">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <span className="text-xs uppercase tracking-[0.25em] text-[#8b949e] font-bold font-mono">Syncing Secure Authentication Tunnel...</span>
      </div>
    );
  }

  // Not authenticated? Divert to custom authentication gate screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col selection:bg-blue-500/30 selection:text-white" id="app-root">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/2 rounded-full blur-[100px] pointer-events-none" />

      {/* App Shell Navbar */}
      <nav className="border-b border-[#30363d] bg-[#161b22] sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold tracking-wide uppercase text-white font-display">
                  Lumina AI <span className="text-[#8b949e] font-normal">v2.0 Flash</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-widest text-white bg-[#21262d] border border-[#30363d] rounded">
                  ANALYZER
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 border border-[#30363d] bg-[#0d1117] px-3 py-1 text-xs rounded-lg text-[#8b949e]">
              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono max-w-[180px] truncate">{currentUser.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-white transition-colors hover:bg-rose-500/10 border border-[#30363d] hover:border-rose-500/30 rounded-lg cursor-pointer font-bold uppercase tracking-wider"
              id="logoff-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Terminate Key</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:grid md:grid-cols-10 gap-6 overflow-hidden min-h-[calc(100vh-76px)]">
        {/* Left Side: Chat Panel */}
        <section className="col-span-10 xl:col-span-7 flex flex-col h-[550px] md:h-[650px] xl:h-full relative z-10">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            onClearHistory={handleClearHistory}
            error={error}
          />
        </section>

        {/* Right Side: Telemetry Analysis Panel */}
        <section className="col-span-10 xl:col-span-3 flex flex-col h-[450px] md:h-[500px] xl:h-full relative z-10">
          <AnalysisPanel
            currentAnalysis={currentAnalysis}
            history={messages}
          />
        </section>
      </main>
    </div>
  );
}
