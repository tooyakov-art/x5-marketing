
import React, { useState } from 'react';
import { ChevronLeft, Globe, Info, ScrollText, Shield, LogOut, RefreshCw, Trash2, ScanFace, CreditCard, Smartphone, Monitor, CheckCircle2, X, Fingerprint } from 'lucide-react';
import { GlassButton } from '../components/GlassComponents';
import { t } from '../services/translations';
import { Language, Platform } from '../types';

interface SettingsViewProps {
    language: Language;
    onClose: () => void;
    onNavigateTo: (mode: string) => void;
    onLogout: () => void;
    onDevTap: () => void;
    // Platform logic
    platform?: Platform;
    onPlatformChange?: (platform: Platform) => void;
    // Admin logic
    isDevMode?: boolean;
}


export const SettingsView: React.FC<SettingsViewProps> = ({ language, onClose, onNavigateTo, onLogout, onDevTap, platform = 'web', onPlatformChange, isDevMode = false }) => {

    const [faceIdEnabled, setFaceIdEnabled] = useState(() => localStorage.getItem('x5_face_id_enabled') === 'true');
    const [showPlatformSelect, setShowPlatformSelect] = useState(false);

    const toggleFaceId = () => {
        const newValue = !faceIdEnabled;
        setFaceIdEnabled(newValue);
        localStorage.setItem('x5_face_id_enabled', String(newValue));
    };

    const handleHardReload = () => {
        if ('caches' in window) {
            caches.keys().then((names) => {
                names.forEach((name) => {
                    caches.delete(name);
                });
            });
        }
        localStorage.removeItem('x5_draft_photo');
        window.location.reload();
    };

    const handlePurgeMemory = () => {
        if ((window as any).gc) (window as any).gc();
        const images = document.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            images[i].src = '';
        }
        alert("Память очищена.");
    };

    const selectPlatform = (p: Platform) => {
        if (onPlatformChange) onPlatformChange(p);
        setShowPlatformSelect(false);
    };

    const getPlatformIcon = () => {
        if (platform === 'ios') return Smartphone;
        if (platform === 'android') return Smartphone;
        return Monitor;
    };

    const getPlatformLabel = () => {
        if (platform === 'ios') return 'Apple Core (iOS)';
        if (platform === 'android') return 'Android Core';
        return 'Web Browser';
    };

    const getPlatformColor = () => {
        if (platform === 'ios') return 'text-black';
        if (platform === 'android') return 'text-green-500';
        return 'text-blue-500';
    };

    const getLanguageLabel = (lang: Language) => {
        const map: Record<string, string> = {
            'ru': 'Русский',
            'en': 'English',
            'kz': 'Қазақша',
            'tr': 'Türkçe',
            'es': 'Español'
        };
        return map[lang] || lang.toUpperCase();
    };

    const isWeb = platform === 'web';
    const isAndroid = platform === 'android';

    return (
        <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-12 relative">

            {/* PLATFORM SELECTOR MODAL */}
            {showPlatformSelect && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl relative overflow-hidden animate-scale-in">
                        <div className="p-6 pb-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Симуляция Среды</h3>
                                <button onClick={() => setShowPlatformSelect(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><X size={18} /></button>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mb-6">Выберите, как приложение должно себя вести.</p>

                            <div className="space-y-3">
                                <button onClick={() => selectPlatform('ios')} className={`w-full p-4 rounded-[20px] flex items-center gap-4 border-2 transition-all ${platform === 'ios' ? 'border-black bg-black text-white' : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-900'}`}>
                                    <Smartphone size={24} className={platform === 'ios' ? 'text-white' : 'text-slate-400'} />
                                    <div className="flex-1 text-left">
                                        <span className="block font-bold">iOS (iPhone)</span>
                                        <span className={`text-[10px]uppercase font-bold tracking-widest ${platform === 'ios' ? 'text-white/60' : 'text-slate-400'}`}>WKWebView</span>
                                    </div>
                                    {platform === 'ios' && <CheckCircle2 size={20} className="text-white" />}
                                </button>

                                <button onClick={() => selectPlatform('android')} className={`w-full p-4 rounded-[20px]flex items-center gap-4 border-2 transition-all ${platform === 'android' ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-900'}`}>
                                    <Smartphone size={24} className={platform === 'android' ? 'text-green-600' : 'text-slate-400'} />
                                    <div className="flex-1 text-left">
                                        <span className="block font-bold">Android</span>
                                        <span className={`text-[10px]uppercase font-bold tracking-widest ${platform === 'android' ? 'text-green-600/70' : 'text-slate-400'}`}>Chrome WebView</span>
                                    </div>
                                    {platform === 'android' && <CheckCircle2 size={20} className="text-green-600" />}
                                </button>

                                <button onClick={() => selectPlatform('web')} className={`w-full p-4 rounded-[20px]flex items-center gap-4 border-2 transition-all ${platform === 'web' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-900'}`}>
                                    <Monitor size={24} className={platform === 'web' ? 'text-blue-600' : 'text-slate-400'} />
                                    <div className="flex-1 text-left">
                                        <span className="block font-bold">Web Browser</span>
                                        <span className={`text-[10px]uppercase font-bold tracking-widest ${platform === 'web' ? 'text-blue-600/70' : 'text-slate-400'}`}>Standard</span>
                                    </div>
                                    {platform === 'web' && <CheckCircle2 size={20} className="text-blue-600" />}
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 text-center mt-4">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Dev Core v3.2</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-8 relative">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"><ChevronLeft size={20} /></button>
                    <h2 className="text-xl font-bold">{t('settings_title', language)}</h2>
                </div>
                <div onClick={onDevTap} className="w-10 h-10 absolute right-0 top-0 opacity-0 active:opacity-10 bg-red-500/20 z-50 cursor-pointer"></div>
            </div>

            <div className="space-y-6 overflow-y-auto pb-10 no-scrollbar">

                {/* Account */}
                <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-3">{t('settings_account', language)}</h3>
                    <GlassButton title={t('settings_language', language)} subtitle={getLanguageLabel(language)} icon={Globe} onClick={() => onNavigateTo('languages')} colorClass="text-blue-500" />
                </div>

                {/* Info */}
                <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-3">{t('settings_info', language)}</h3>
                    <GlassButton title={t('settings_support', language)} icon={Info} onClick={() => onNavigateTo('contacts')} colorClass="text-purple-600" />
                    <GlassButton title={t('settings_offer', language)} icon={ScrollText} onClick={() => onNavigateTo('offer')} colorClass="text-emerald-600" />
                    <GlassButton title={t('settings_privacy', language)} icon={Shield} onClick={() => onNavigateTo('privacy')} colorClass="text-slate-500" />
                    <GlassButton title={t('settings_payment', language)} icon={CreditCard} onClick={() => onNavigateTo('payment')} colorClass="text-orange-500" />
                </div>

                {/* System */}
                <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-3">{t('settings_system', language)}</h3>

                    {/* Platform Switcher (Only Visible in Dev Mode) */}
                    {isDevMode && (
                        <GlassButton
                            title={t('settings_platform', language)}
                            subtitle={getPlatformLabel()}
                            icon={getPlatformIcon()}
                            onClick={() => setShowPlatformSelect(true)}
                            colorClass={getPlatformColor()}
                        />
                    )}

                    {/* Biometric Toggle - HIDDEN ON WEB */}
                    {!isWeb && (
                        <GlassButton
                            title={isAndroid ? t('settings_touchid', language) : t('settings_faceid', language)}
                            subtitle={faceIdEnabled ? (language === 'en' ? "Enabled" : "Активно") : (language === 'en' ? "Disabled" : "Отключено")}
                            icon={isAndroid ? Fingerprint : ScanFace}
                            onClick={toggleFaceId}
                            colorClass={faceIdEnabled ? "text-green-500" : "text-slate-400"}
                        />
                    )}

                    <button onClick={handlePurgeMemory} className="w-full glass-card p-5 rounded-[32px] flex items-center gap-5 text-left group hover:bg-slate-50 transition-colors mb-3">
                        <div className="w-14 h-14 flex items-center justify-center rounded-[20px] bg-red-100 text-red-600"><Trash2 size={24} /></div>
                        <div><h3 className="text-[15px] font-bold text-slate-900">{t('settings_ram', language)}</h3><p className="text-[11px] text-slate-500">Если зависли кнопки</p></div>
                    </button>
                    <button onClick={handleHardReload} className="w-full glass-card p-5 rounded-[32px] flex items-center gap-5 text-left group hover:bg-slate-50 transition-colors">
                        <div className="w-14 h-14 flex items-center justify-center rounded-[20px] bg-slate-100 text-slate-600"><RefreshCw size={24} /></div>
                        <div><h3 className="text-[15px] font-bold text-slate-900">{t('settings_reload', language)}</h3><p className="text-[11px] text-slate-500">Сброс кэша и памяти</p></div>
                    </button>
                </div>

                <button onClick={onLogout} className="w-full py-4 text-red-500 font-bold bg-white rounded-[20px] flex items-center justify-center gap-2 mt-4 shadow-sm"><LogOut size={18} /> {t('settings_logout', language)}</button>
                <p className="text-center text-[10px] text-slate-400 pt-4">Version 3.1.0 (Native Core)</p>
            </div>
        </div>
    );
};
