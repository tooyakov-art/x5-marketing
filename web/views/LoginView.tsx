import React, { useState } from 'react';
import { User } from 'lucide-react';
import { User as UserType } from '../types';
import { auth, googleProvider } from '../firebase';

interface LoginViewProps {
  onLogin: (user: UserType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      
      if (user) {
        onLogin({
          id: user.uid,
          name: user.displayName || 'Пользователь',
          email: user.email || undefined,
          avatar: user.photoURL || undefined,
          isGuest: false,
          plan: 'free'
        });
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onLogin({
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      name: 'Гость',
      isGuest: true,
      plan: 'free'
    });
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden animate-fade-in">
      
      {/* 1. Header Section (Top) */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-6 px-8 z-10 text-center">
        <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8 border border-white/60 animate-slide-up">
           <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 tracking-tighter">X5</span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight animate-slide-up" style={{animationDelay: '0.1s'}}>
          X5 OS
        </h1>
        <p className="text-slate-500 font-medium text-base leading-relaxed max-w-[260px] mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
          Элитный ИИ-ассистент для создания контрактов и креативов.
        </p>
      </div>

      {/* 2. Action Section (Bottom) */}
      <div className="p-6 pb-10 z-20">
        <div className="glass-panel p-6 rounded-[32px] border border-white/60 shadow-2xl space-y-4 animate-slide-up" style={{animationDelay: '0.3s'}}>
          
          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-[20px] shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden group border border-slate-100"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[15px]">Войти через Google</span>
              </>
            )}
          </button>

          {/* Guest Button */}
          <button 
            onClick={handleGuestLogin}
            className="w-full bg-slate-100/50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all text-[15px]"
          >
            <User size={18} />
            <span>Войти как Гость</span>
          </button>
          
          <p className="text-[10px] text-center text-slate-400 pt-2 font-medium">
             Нажимая кнопку, вы соглашаетесь с Политикой конфиденциальности.
          </p>
        </div>
      </div>

    </div>
  );
};
