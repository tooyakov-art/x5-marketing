
import React, { useState } from 'react';
import { User as UserIcon, CreditCard, ChevronRight, Crown, Settings, Bell, Globe, HelpCircle, LogOut, Shield, FileText, Zap, ChevronLeft, Check } from 'lucide-react';
import { GlassButton } from '../components/GlassComponents';
import { User, Language } from '../types';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, language, setLanguage }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'menu' | 'languages'>('menu');

  const getLanguageLabel = (lang: Language) => {
    switch(lang) {
      case 'ru': return 'Русский';
      case 'en': return 'English';
      case 'kz': return 'Қазақша';
      default: return 'Русский';
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setSettingsMode('menu');
  };

  // --- SETTINGS: LANGUAGES SUB-VIEW ---
  if (showSettings && settingsMode === 'languages') {
     return (
       <div className="flex flex-col h-full animate-fade-in px-6 pt-6 pb-24 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
           <button onClick={() => setSettingsMode('menu')} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform">
             <ChevronLeft className="text-slate-600" size={22} />
           </button>
           <h2 className="text-xl font-bold text-slate-900">Выберите язык</h2>
        </div>

        <div className="space-y-3">
          {[
            { id: 'ru', label: 'Русский', flag: '🇷🇺' },
            { id: 'en', label: 'English', flag: '🇺🇸' },
            { id: 'kz', label: 'Қазақша', flag: '🇰🇿' },
          ].map((langItem) => (
             <button
               key={langItem.id}
               onClick={() => handleLanguageSelect(langItem.id as Language)}
               className="w-full glass-card p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-transform"
             >
               <div className="flex items-center gap-4">
                 <span className="text-2xl">{langItem.flag}</span>
                 <span className={`text-[17px] font-bold ${language === langItem.id ? 'text-slate-900' : 'text-slate-500'}`}>
                   {langItem.label}
                 </span>
               </div>
               {language === langItem.id && (
                 <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                   <Check size={16} strokeWidth={3} />
                 </div>
               )}
             </button>
          ))}
        </div>
      </div>
     );
  }

  // --- SETTINGS: MAIN MENU ---
  if (showSettings) {
    return (
      <div className="flex flex-col h-full animate-fade-in px-6 pt-6 pb-24 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
           <button onClick={() => setShowSettings(false)} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform">
             <ChevronLeft className="text-slate-600" size={22} />
           </button>
           <h2 className="text-xl font-bold text-slate-900">Настройки</h2>
        </div>
        
        <div className="space-y-6">
           <div>
             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-3">Аккаунт</h3>
             <GlassButton title="Уведомления" icon={Bell} onClick={() => {}} colorClass="text-orange-500" />
             <GlassButton 
               title="Язык / Language" 
               subtitle={getLanguageLabel(language)} 
               icon={Globe} 
               onClick={() => setSettingsMode('languages')} 
               colorClass="text-blue-500" 
             />
           </div>
           
           <div>
             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-3">Инфо</h3>
             <GlassButton title="Безопасность" icon={Shield} onClick={() => {}} colorClass="text-slate-500" />
             <GlassButton title="Поддержка" icon={HelpCircle} onClick={() => {}} colorClass="text-emerald-500" />
           </div>

           <div className="pt-4">
             <button 
                onClick={onLogout}
                className="w-full py-4 text-red-500 font-bold bg-white/50 border border-white/60 backdrop-blur-md rounded-[22px] flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm active:scale-95"
             >
                <LogOut size={18} /> Выйти
             </button>
             <p className="text-center text-[10px] text-slate-400 mt-4 opacity-60">X5 OS Build 2025.1</p>
           </div>
        </div>
      </div>
    );
  }

  // --- MAIN PROFILE VIEW ---
  return (
    <div className="flex flex-col h-full animate-fade-in px-6 pt-6 pb-24 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-extrabold text-slate-900">Профиль</h1>
         <button onClick={() => setShowSettings(true)} className="w-10 h-10 glass-card rounded-full flex items-center justify-center text-slate-600 active:scale-95 transition-transform shadow-sm">
           <Settings size={20} />
         </button>
      </div>

      {/* Avatar Section */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white p-1 shadow-xl shadow-blue-900/5">
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={32} className="text-slate-300" />
              )}
            </div>
          </div>
          <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-[3px] border-[#f0f2f5] flex items-center justify-center ${user.plan === 'black' ? 'bg-slate-900' : (user.isGuest ? 'bg-slate-400' : 'bg-emerald-500')}`}>
             {user.plan === 'black' && <Crown size={10} className="text-yellow-400" />}
          </div>
        </div>
        
        <div>
           <h2 className="text-xl font-bold text-slate-900 leading-tight">
             {user.name}
           </h2>
           <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.plan === 'free' ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white'}`}>
             {user.isGuest ? 'Guest' : (user.plan === 'black' ? 'Black Member' : 'Pro Member')}
           </span>
        </div>
      </div>

      {/* Plan Card (Apple Wallet Style) */}
      <div className={`p-6 rounded-[28px] mb-8 relative overflow-hidden shadow-2xl shadow-slate-900/10 transition-all group ${user.plan === 'free' ? 'bg-white border border-white' : 'bg-slate-900 text-white'}`}>
        
        {/* Abstract Background Art for Black Plan */}
        {user.plan !== 'free' && (
           <>
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-[50px] opacity-30"></div>
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-[50px] opacity-30"></div>
           </>
        )}
        
        <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
             <div>
                <h3 className={`text-lg font-bold ${user.plan === 'free' ? 'text-slate-900' : 'text-white'}`}>
                  {user.plan === 'free' ? 'Basic' : 'X5 Black'}
                </h3>
                <p className={`text-xs font-medium mt-0.5 ${user.plan === 'free' ? 'text-slate-400' : 'text-slate-400'}`}>
                   {user.plan === 'free' ? 'Ограниченный доступ' : 'Unlimited Access'}
                </p>
             </div>
             {user.plan !== 'free' && <Crown className="text-yellow-400 fill-yellow-400" size={24} />}
          </div>

          <div className="mt-6">
            {user.plan === 'free' ? (
               <button className="w-full py-3 bg-slate-900 text-white rounded-[18px] text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Zap size={14} className="fill-yellow-400 text-yellow-400"/>
                  Улучшить до Pro
               </button>
            ) : (
               <div className="flex items-center gap-2 opacity-50">
                  <span className="text-[10px] uppercase tracking-widest">Valid until 12/26</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-3">Статистика</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/60 p-4 rounded-[24px] border border-white shadow-sm flex flex-col">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <FileText size={16} />
              </div>
              <span className="text-2xl font-extrabold text-slate-900">{user.isGuest ? '0' : '12'}</span>
              <span className="text-[10px] text-slate-500 font-bold">Договоров</span>
          </div>
          <div className="bg-white/60 p-4 rounded-[24px] border border-white shadow-sm flex flex-col">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-2">
                <Zap size={16} />
              </div>
              <span className="text-2xl font-extrabold text-slate-900">{user.isGuest ? '0' : '45'}</span>
              <span className="text-[10px] text-slate-500 font-bold">Креативов</span>
          </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-3">
        {user.isGuest && (
          <GlassButton 
             title="Создать аккаунт" 
             subtitle="Сохраните свои документы"
             icon={UserIcon} 
             onClick={() => {}} 
             colorClass="text-blue-600"
          />
        )}
        <GlassButton title="Моя подписка" icon={CreditCard} onClick={() => {}} colorClass="text-purple-600" />
      </div>

    </div>
  );
};
