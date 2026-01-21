
import React from 'react';
import { Check, Globe, ChevronLeft } from 'lucide-react';
import { Language } from '../types';

interface LanguageViewProps {
  onSelect: (lang: Language) => void;
  onBack?: () => void;
  currentLanguage?: Language;
}

export const LanguageView: React.FC<LanguageViewProps> = ({ onSelect, onBack, currentLanguage }) => {
  const primaryLanguages: { id: Language; label: string; flag: string; local: string }[] = [
    { id: 'kz', label: 'Kazakh', flag: '🇰🇿', local: 'Қазақша' },
    { id: 'ru', label: 'Russian', flag: '🇷🇺', local: 'Русский' },
    { id: 'en', label: 'English', flag: '🇺🇸', local: 'English' },
  ];

  const otherLanguages: { id: Language; label: string; flag: string; local: string }[] = [
    { id: 'tr', label: 'Turkish', flag: '🇹🇷', local: 'Türkçe' },
    { id: 'cn', label: 'Chinese', flag: '🇨🇳', local: '中文' },
    { id: 'ae', label: 'Arabic', flag: '🇦🇪', local: 'العربية' },
    { id: 'es', label: 'Spanish', flag: '🇪🇸', local: 'Español' },
    { id: 'fr', label: 'French', flag: '🇫🇷', local: 'Français' },
    { id: 'de', label: 'German', flag: '🇩🇪', local: 'Deutsch' },
    { id: 'it', label: 'Italian', flag: '🇮🇹', local: 'Italiano' },
    { id: 'jp', label: 'Japanese', flag: '🇯🇵', local: '日本語' },
  ];

  return (
    <div className="flex flex-col h-full items-center px-6 animate-fade-in bg-[#f2f4f6] relative">
      
      {/* Header with Back Button */}
      <div className="w-full pt-16 pb-4 flex justify-between items-center relative z-20">
          {onBack && (
              <button 
                onClick={onBack} 
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-slate-50 absolute left-0 top-16"
              >
                  <ChevronLeft className="text-slate-900" size={20} />
              </button>
          )}
      </div>

      <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-900/10 mb-8 border border-white animate-slide-up mt-8">
         <Globe size={40} className="text-blue-600" />
      </div>
      
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2 text-center animate-slide-up" style={{animationDelay: '0.1s'}}>
        Select Language
      </h1>
      <p className="text-slate-500 mb-10 text-center text-sm animate-slide-up" style={{animationDelay: '0.2s'}}>
        Выберите язык интерфейса / Тілді таңдаңыз
      </p>

      <div className="w-full max-w-md space-y-6 pb-20 animate-slide-up overflow-y-auto no-scrollbar flex-1" style={{animationDelay: '0.3s'}}>
        
        {/* Primary */}
        <div className="space-y-3">
            {primaryLanguages.map((lang) => {
                const isSelected = currentLanguage === lang.id;
                return (
                <button
                    key={lang.id}
                    onClick={() => onSelect(lang.id)}
                    className={`w-full glass-card p-5 rounded-[24px] flex items-center justify-between group active:scale-[0.98] transition-all border shadow-sm ${isSelected ? 'bg-white border-blue-500/30 ring-2 ring-blue-500/10' : 'bg-white/40 border-white/60 hover:bg-white'}`}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-3xl drop-shadow-sm">{lang.flag}</span>
                        <div className="text-left">
                            <span className="block text-[17px] font-bold text-slate-900 leading-tight">{lang.local}</span>
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{lang.label}</span>
                        </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300 group-hover:text-slate-500'}`}>
                        <Check size={16} strokeWidth={3} />
                    </div>
                </button>
            )})}
        </div>

        <div className="w-full h-px bg-slate-200/60 my-4"></div>

        {/* Others - Grid Layout */}
        <div className="grid grid-cols-2 gap-3 pb-8">
            {otherLanguages.map((lang) => {
                const isSelected = currentLanguage === lang.id;
                return (
                <button
                    key={lang.id}
                    onClick={() => onSelect(lang.id)}
                    className={`w-full glass-card p-4 rounded-[20px] flex items-center gap-3 active:scale-[0.98] transition-all border ${isSelected ? 'bg-white border-blue-500/30' : 'bg-white/30 border-white/40 hover:bg-white'}`}
                >
                     <span className="text-2xl">{lang.flag}</span>
                     <div className="text-left overflow-hidden min-w-0">
                        <span className="block text-sm font-bold text-slate-800 truncate">{lang.local}</span>
                     </div>
                     {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>}
                </button>
            )})}
        </div>
      </div>
    </div>
  );
};
