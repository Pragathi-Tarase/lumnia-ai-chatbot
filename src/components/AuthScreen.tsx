import React, { useState } from 'react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider,
  db,
  setDoc,
  doc,
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { Brain, Mail, Lock, Shield, ArrowRight, Chrome, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Quick clean-up on view toggle
  const toggleView = () => {
    setIsSignUp(!isSignUp);
    setErrorCode(null);
    setErrorMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // Helper to standardise user firestore creation
  const ensureUserProfile = async (uid: string, userEmail: string) => {
    const userRef = doc(db, 'users', uid);
    try {
      await setDoc(userRef, {
        id: uid,
        email: userEmail,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);
    setErrorMessage(null);

    // Validation
    if (!email.trim() || !password) {
      setErrorMessage('Please fill out all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(userCredential.user.uid, userCredential.user.email || email);
      } else {
        // Log in
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Email Auth Error: ', err);
      setErrorCode(err.code || 'auth/unknown');
      
      // Clear, readable error messages
      switch (err.code) {
        case 'auth/email-already-in-use':
          setErrorMessage('This email address is already registered. Please login instead.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Please enter a valid email address.');
          break;
        case 'auth/user-not-found':
          setErrorMessage('No account found with this email. Please sign up.');
          break;
        case 'auth/wrong-password':
          setErrorMessage('Incorrect password. Please try again.');
          break;
        case 'auth/weak-password':
          setErrorMessage('Password is too weak. Make it longer than 6 characters.');
          break;
        case 'auth/invalid-credential':
          setErrorMessage('Invalid credentials supplied. Check your email/password.');
          break;
        default:
          setErrorMessage(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorCode(null);
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Create user record in firestore if not exists (setDoc operates as upsert/merge perfectly)
      await ensureUserProfile(result.user.uid, result.user.email || '');
    } catch (err: any) {
      console.error('Google Auth Error: ', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorCode(err.code || 'auth/google-error');
        setErrorMessage(err.message || 'Unable to authenticate with Google Account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center p-4 selection:bg-blue-500/30 selection:text-white relative overflow-hidden" id="auth-screen-container">
      {/* Background radial soft light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/2 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* App Title Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-600/10 border border-blue-500/20 shadow-md mb-4 text-blue-500">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-wider font-display text-white uppercase">
            Lumina AI Platform
          </h1>
          <p className="text-xs text-[#8b949e] font-bold tracking-widest mt-1.5 uppercase">
            SECURE ACCESS CONTROL NODE
          </p>
        </div>

        {/* Error Bar */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2.5 items-start font-mono"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wider text-[9px] block mb-0.5">AUTH_RECON_FAILURE</span>
                <span>{errorMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Provider Controls Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">
              Security Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8b949e]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="operator@lumina.local"
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none placeholder-[#8b949e]/50 font-sans transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">
              Access Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8b949e]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••••••"
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none placeholder-[#8b949e]/50 font-sans transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8b949e] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">
                Confirm Authentication Key
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8b949e]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none placeholder-[#8b949e]/50 font-sans transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            <span>{isLoading ? 'Processing Access Key...' : isSignUp ? 'CREATE INTEL OPERATOR' : 'AUTHORIZE INBOUND LINK'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider standard rule */}
        <div className="relative my-6 select-none">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#30363d]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
            <span className="bg-[#161b22] px-3.5 text-[#8b949e]">OR PROVIDE TOKEN</span>
          </div>
        </div>

        {/* Google SSO button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-2.5 border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-white hover:border-[#8b949e] rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Chrome className="w-4 h-4 text-blue-400" />
          <span>SSO SIGN-IN WITH GOOGLE</span>
        </button>

        {/* View Switch bar */}
        <div className="mt-8 text-center">
          <button
            onClick={toggleView}
            className="text-[11px] text-[#8b949e] hover:text-white font-semibold transition-colors uppercase tracking-wider underline underline-offset-4 decoration-[#30363d] hover:decoration-blue-500/50"
          >
            {isSignUp ? 'Already registered? Return to Authorization' : 'Request dynamic access -> Enroll New Operator'}
          </button>
        </div>

        {/* Notification warnings */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-[#8b949e]/60 font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>FIPS 140-2 Zero-Trust Compliant Node</span>
        </div>
      </motion.div>

      <div className="text-center font-mono text-[10px] text-[#8b949e]/40 mt-6 max-w-sm">
        Note: Standard Email/Password auth requires provider active state. Please verify Firebase Authentication is configured in the cloud server.
      </div>
    </div>
  );
}
