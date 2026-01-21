
import React, { useEffect } from 'react';
import { CheckCircle2, Home, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SuccessViewProps {
  onGoHome: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ onGoHome }) => {
  
  useEffect(() => {
    // Optimization: Run for exactly 2 seconds then stop
    const duration = 2000;
    const end = Date.now() + duration;
    let animationFrameId: number;

    const frame = () => {
      // Launch a few confetti from the left edge
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#34d399', '#3b82f6', '#f472b6']
      });
      // and a few from the right edge
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#34d399', '#3b82f6', '#f472b6']
      });

      // Keep going until we are out of time
      if (Date.now() < end) {
        animationFrameId = requestAnimationFrame(frame);
      }
    };

    frame();

    // MEMORY LEAK FIX: Clean up animation frame on unmount
    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 animate-fade-in text-center bg-white relative overflow-hidden">
      
      {/* Reduced background blur load */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-green-400/20 blur-[50px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[30%] bg-blue-400/20 blur-[50px] rounded-full pointer-events-none"></div>

      <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30 animate-bounce relative z-10">
        <CheckCircle2 size={48} className="text-white" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Оплата прошла!</h1>
      <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 mb-6">
         <Zap size={16} className="text-yellow-500 fill-yellow-500"/>
         <span className="text-sm font-bold text-slate-700">+1000 Кредитов</span>
      </div>

      <p className="text-slate-500 font-medium text-base mb-10 max-w-xs leading-relaxed">
        Баланс пополнен. Теперь вам доступны все Premium функции X5.
      </p>

      <button 
        onClick={onGoHome}
        className="w-full max-w-xs bg-slate-900 text-white font-bold py-4 rounded-[24px] shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform relative z-10"
      >
        <Home size={20} />
        <span>Начать творить</span>
      </button>
    </div>
  );
};
