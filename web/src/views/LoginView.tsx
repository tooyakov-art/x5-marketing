
import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, LogIn, X, Lock, ScanFace, CheckCircle2, FileText, CreditCard, User, Fingerprint } from 'lucide-react';
import { User as UserType, Language, Platform } from '../types';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';
import { t } from '../services/translations';
import { LegalView } from './LegalView'; // Import overlay

const X5Logo = () => (
  <div className="flex items-center justify-center w-full h-full bg-slate-900 text-white rounded-[20px]">
    <span className="font-extrabold text-2xl tracking-tighter">X5</span>
  </div>
);

const InputField = ({ type, placeholder, value, onChange }: any) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full bg-white border border-slate-200 rounded-[18px] px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-[15px]"
  />
);

interface LoginViewProps {
  onLogin: (user: UserType) => void;
  onCancel?: () => void;
  isModal?: boolean;
  language?: Language;
  platform?: Platform;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onCancel, isModal = false, language = 'ru', platform = 'web' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'select' | 'email'>('select');
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // New States for Overlays
  const [showLegal, setShowLegal] = useState<'offer' | 'privacy' | 'payment' | null>(null);
  const [consentGiven, setConsentGiven] = useState(false); // Checkbox state

  // Face ID State
  const [isScanning, setIsScanning] = useState(() => {
    // Only auto-scan if not in modal mode AND NOT on Web
    return platform !== 'web' && !isModal && localStorage.getItem('x5_face_id_enabled') === 'true';
  });
  const [scanSuccess, setScanSuccess] = useState(false);
  const scanTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!isScanning) return;
    scanTimerRef.current = setTimeout(() => {
      setScanSuccess(true);
      setTimeout(() => {
        onLogin({
          id: 'faceid-' + Date.now(),
          name: 'Biometric User',
          isGuest: false,
          plan: 'free',
          credits: 0,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
        });
      }, 800);
    }, 2000);
    return () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); };
  }, [isScanning]);

  // Handle Redirect Result (for Google Login Page)
  useEffect(() => {
    auth.getRedirectResult().then((result) => {
      if (result && result.user) {
        onLogin({
          id: result.user.uid,
          name: result.user.displayName || 'Пользователь',
          email: result.user.email || undefined,
          avatar: result.user.photoURL || undefined,
          isGuest: false,
          plan: 'free',
          credits: 0
        });
      }
    }).catch((error) => {
      if (error.code !== 'auth/operation-not-supported-in-this-environment') {
        console.error("Redirect Auth Error", error);
      }
    });
  }, []);

  const handleCancelScan = () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setIsScanning(false);
  };

  const handleAppleLogin = async () => {
    if (!consentGiven) {
      setError("Пожалуйста, примите условия оферты и политики конфиденциальности.");
      return;
    }

    // --- NATIVE BRIDGE FOR IOS ---
    if (platform !== 'web') {
      import('../services/nativeBridge').then(({ NativeBridge }) => {
        NativeBridge.loginApple();
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await auth.signInWithPopup(new firebase.auth.OAuthProvider('apple.com'));
      if (result.user) {
        onLogin({
          id: result.user.uid,
          name: result.user.displayName || 'Пользователь Apple',
          email: result.user.email || undefined,
          avatar: result.user.photoURL || undefined,
          isGuest: false,
          plan: 'free',
          credits: 0
        });
      }
    } catch (error: any) {
      console.error("Apple Auth Error:", error);
      setError("Ошибка входа через Apple: " + error.message);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!consentGiven) {
      setError("Пожалуйста, примите условия оферты и политики конфиденциальности.");
      return;
    }

    // --- NATIVE BRIDGE FOR IOS/ANDROID ---
    if (platform !== 'web') {
      import('../services/nativeBridge').then(({ NativeBridge }) => {
        NativeBridge.loginGoogle();
      });
      // We don't await here, the App.tsx listener handles the callback 'AUTH_SUCCESS'
      return;
    }

    setIsLoading(true);
    setError('');

    // Safety Timeout
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError("Превышено время ожидания. Попробуйте еще раз.");
      }
    }, 15000);

    try {
      console.log("Starting Google Popup...");
      const result = await auth.signInWithPopup(googleProvider);
      clearTimeout(timeout);

      console.log("Popup Result:", result);

      if (result.user) {
        onLogin({
          id: result.user.uid,
          name: result.user.displayName || 'Пользователь',
          email: result.user.email || undefined,
          avatar: result.user.photoURL || undefined,
          isGuest: false,
          plan: 'free',
          credits: 0
        });
      } else {
        setIsLoading(false);
      }
    } catch (error: any) {
      clearTimeout(timeout);
      console.error("Google Auth Error:", error);

      // Fallback to redirect if popup is blocked or not supported
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment' || error.code === 'auth/cancelled-popup-request') {
        console.warn("Popup failed, trying redirect...", error.code);
        setError("Popup blocked, trying redirect...");
        try {
          await auth.signInWithRedirect(googleProvider);
          return;
        } catch (redirError: any) {
          setError("Ошибка входа: " + redirError.message);
        }
      } else {
        setError("Ошибка: " + (error.message || "Unknown error"));
      }
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!consentGiven) {
      setError("Пожалуйста, примите условия.");
      return;
    }
    setIsLoading(true);
    try {
      // Attempt real anonymous auth for persistence
      await auth.signInAnonymously();
      // We rely on onAuthStateChanged in App.tsx to handle the redirect
    } catch (e) {
      console.warn("Guest Auth Failed, using local", e);
      // Fallback to local simulation
      onLogin({
        id: 'guest-' + Math.random().toString(36).substr(2, 9),
        name: 'Гость',
        isGuest: true,
        plan: 'free',
        credits: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!consentGiven) {
      setError("Необходимо согласие с документами.");
      return;
    }
    if (!email || !password) return;
    setIsLoading(true);
    setError('');

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await auth.createUserWithEmailAndPassword(email, password);
      } else {
        userCredential = await auth.signInWithEmailAndPassword(email, password);
      }

      if (userCredential && userCredential.user) {
        onLogin({
          id: userCredential.user.uid,
          name: userCredential.user.email?.split('@')[0] || 'User',
          email: userCredential.user.email || undefined,
          isGuest: false,
          plan: 'free',
          credits: 0
        });
      }
    } catch (fbError: any) {
      console.error("Auth Error", fbError);

      if (fbError.code === 'auth/email-already-in-use') {
        setError("Этот Email уже зарегистрирован. Пожалуйста, войдите.");
      } else if (fbError.code === 'auth/wrong-password') {
        setError("Неверный пароль.");
      } else if (fbError.code === 'auth/user-not-found') {
        setError("Пользователь не найден. Пожалуйста, зарегистрируйтесь.");
      } else if (fbError.code === 'auth/weak-password') {
        setError("Пароль слишком слабый (минимум 6 символов).");
      } else {
        setError("Ошибка: " + (fbError.message || "Попробуйте позже"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- OVERLAYS ---
  if (showLegal) {
    return (
      <div className="fixed inset-0 z-[60] bg-white h-full w-full">
        <LegalView type={showLegal} language={language} onBack={() => setShowLegal(null)} />
      </div>
    );
  }

  // --- BIOMETRIC SCAN UI (IOS / ANDROID) ---
  if (isScanning && platform !== 'web') {
    const isAndroid = platform === 'android';
    const BiometricIcon = isAndroid ? Fingerprint : ScanFace;
    const title = isAndroid ? t('settings_touchid', language) : t('settings_faceid', language);

    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f2f4f6] relative animate-fade-in p-6 text-center">
        <div className="relative mb-8">
          <div className={`absolute inset-0 rounded-full border-4 border-blue-500/20 ${!scanSuccess ? 'animate-ping' : ''}`} style={{ animationDuration: '1.5s' }}></div>
          <div className={`absolute inset-[-20px] rounded-full border-4 border-blue-500/10 ${!scanSuccess ? 'animate-ping' : ''}`} style={{ animationDuration: '2s' }}></div>
          <div className={`w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${scanSuccess ? 'scale-110 ring-4 ring-green-500' : 'ring-4 ring-transparent'}`}>
            {scanSuccess ? <CheckCircle2 size={50} className="text-green-500 animate-scale-in" /> : <BiometricIcon size={50} className="text-slate-900 animate-pulse" />}
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{scanSuccess ? "Успешно" : title}</h2>
        <p className="text-slate-500 font-medium text-sm mb-12">{scanSuccess ? "Вход..." : "Сканирование..."}</p>
        {!scanSuccess && <button onClick={handleCancelScan} className="py-3 px-8 bg-white text-slate-900 font-bold rounded-[20px] shadow-lg border border-slate-200 active:scale-95 transition-transform text-sm">{t('auth_action_login', language)}</button>}
      </div>
    );
  }

  // Platform Logic
  const showApple = platform === 'web' || platform === 'ios';
  const showGoogle = platform === 'web' || platform === 'android' || platform === 'ios';

  // --- MAIN LOGIN FORM ---
  return (
    <div className={`flex flex-col h-full relative overflow-hidden animate-fade-in ${isModal ? 'bg-transparent' : 'bg-[#f2f4f6] md:bg-transparent'} justify-center`}>
      {isModal && onCancel && <button onClick={onCancel} className="absolute top-6 right-6 z-50 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"><X size={20} /></button>}

      {/* HEADER */}
      <div className={`flex flex-col items-center justify-center px-8 z-10 text-center transition-all duration-500 ${viewMode === 'email' ? 'pt-8 pb-4' : 'pt-12 pb-6'}`}>
        <div className="w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl shadow-slate-200 mb-6 border border-white animate-slide-up bg-white p-1">
          {isModal ? <X5Logo /> : <span className="text-3xl font-extrabold text-slate-900 tracking-tighter">X5</span>}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight animate-slide-up leading-tight">
          {isModal ? t('profile_login_promo', language) : t('auth_welcome_title', language)}
        </h1>
        {!isModal && (
          <div className="flex gap-4 mt-2 mb-4 animate-slide-up">
            <button onClick={() => setShowLegal('offer')} className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm hover:text-slate-800">
              <FileText size={12} /> {t('settings_offer', language)}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 pb-10 z-20 w-full max-w-md mx-auto">
        <div className={`glass-panel p-6 rounded-[32px] animate-slide-up bg-white shadow-xl border border-white ${isModal ? 'shadow-2xl' : ''}`}>

          {/* CONSENT CHECKBOX */}
          <div className="mb-6 flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer" onClick={() => setConsentGiven(!consentGiven)}>
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5 ${consentGiven ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}
            >
              {consentGiven && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight select-none">
              {t('auth_terms', language)}
            </p>
          </div>

          {viewMode === 'select' && (
            <div className="space-y-4">

              {/* Apple Button */}
              {showApple && (
                <button onClick={handleAppleLogin} className="w-full bg-black text-white font-bold py-4 rounded-[20px] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all text-[15px]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08.35-1.48 1.22-3.08.48-4.08-1.1-2.22-3.5-.9-8.76 2.68-8.8 1.45-.04 2.27.8 2.95.83.68.03 2.05-1.02 3.53-.87 3.3.15 4.3 2.37 4.3 2.37-2.33 1.23-1.85 4.8.92 5.87-.63 1.6-1.48 3.12-2.45 4.23-1.02 1.15-2.22.95-1.69-3.23zM12.03 7.25c-.15-2.28 1.63-4.25 3.95-4.25.3 2.65-2.43 4.53-3.95 4.25z" /></svg>
                  <span>{t('auth_apple', language)}</span>
                </button>
              )}

              {/* Google Button */}
              {showGoogle && (
                <button onClick={handleGoogleLogin} className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-[20px] shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all text-[15px] border border-slate-200">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  <span>{t('auth_google', language)}</span>
                </button>
              )}

              {/* Guest Button - NOW ASYNC */}
              <button onClick={handleGuestLogin} disabled={isLoading} className="w-full bg-slate-100/50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all text-[15px]">
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <><User size={18} /><span>{t('auth_guest', language)}</span></>}
              </button>

              {/* Email Option */}
              <button onClick={() => setViewMode('email')} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all text-[13px]">
                <Mail size={16} /> <span>Email</span>
              </button>
            </div>
          )}

          {viewMode === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => { setViewMode('select'); setError(''); }} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={20} /></button>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isSignUp ? t('auth_action_signup', language) : t('auth_action_login', language)}</span>
                <div className="w-8" />
              </div>
              <div className="space-y-3">
                <InputField type="email" placeholder={t('auth_email_placeholder', language)} value={email} onChange={(e: any) => setEmail(e.target.value)} />
                <InputField type="password" placeholder={t('auth_pass_placeholder', language)} value={password} onChange={(e: any) => setPassword(e.target.value)} />
              </div>
              <button onClick={handleEmailAuth} disabled={isLoading} className="w-full bg-slate-900 text-white hover:opacity-90 font-bold py-4 rounded-[20px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-2">
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div> : <><LogIn size={18} /><span>{isSignUp ? t('auth_action_signup', language) : t('auth_action_login', language)}</span></>}
              </button>
              <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="w-full py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors">
                {isSignUp ? t('auth_toggle_login', language) : t('auth_toggle_signup', language)}
              </button>
            </div>
          )}

          {error && <div className="mt-4 bg-red-50 text-red-500 border border-red-100 rounded-[16px] p-3 text-xs text-center font-bold">{error}</div>}
        </div>
      </div>
    </div>
  );
};
