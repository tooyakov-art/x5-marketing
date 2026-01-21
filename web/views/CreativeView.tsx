import React from 'react';
import { Construction } from 'lucide-react';

export const CreativeView: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Spacer to push content down slightly since header was removed */}
      <div className="pt-8" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pb-20">
        <div className="w-24 h-24 glass-card rounded-full flex items-center justify-center mb-6 text-pink-500 shadow-lg shadow-pink-500/20">
          <Construction size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-3">В разработке</h3>
        <p className="text-slate-500 max-w-[250px] leading-relaxed">
          Мы работаем над созданием мощного ИИ для генерации рекламных креативов. Загляните позже!
        </p>
        
        <div className="mt-10 w-full max-w-xs h-2 bg-slate-200/60 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 w-2/3 rounded-full animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
        </div>
        <span className="text-xs font-bold text-slate-400 mt-3 tracking-wider uppercase">Готовность 70%</span>
      </div>
    </div>
  );
};