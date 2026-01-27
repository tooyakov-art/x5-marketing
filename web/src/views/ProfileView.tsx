
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Crown, Settings, Zap, History, ChevronRight, Key, LogIn, Briefcase, Trash2, Star, Shield, Pencil, Check, X, Calendar, Plus, FileText, Building2 } from 'lucide-react';
import { User, Language, HistoryItem, ViewState, UsageState, Platform } from '../types';
import { subscribeToHistory } from '../services/historyService';
import { t } from '../services/translations';
import { getPaymentData } from '../services/paymentService';
import { db } from '../firebase'; // Added db import

// Sub-Views
import { SettingsView } from './SettingsView';
import { SupportView } from './SupportView';
import { LegalView } from './LegalView';
import { ApiManagerView } from './ApiManagerView';
import { PaywallView } from './PaywallView';
import { LanguageView } from './LanguageView';
import { LoginView } from './LoginView';

interface ProfileViewProps {
    user: User;
    onLogout: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    onUpdateUser?: (user: User) => void;
    onRestoreHistory?: (item: HistoryItem) => void;
    onBack?: () => void;
    onNavigate?: (view: ViewState) => void;
    usage?: UsageState;
    platform?: Platform;
    onPlatformChange?: (platform: Platform) => void;
    onToggleTabBar?: (visible: boolean) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, language, setLanguage, onRestoreHistory, onNavigate, onUpdateUser, usage, platform = 'web', onPlatformChange, onToggleTabBar }) => {
    const [currentMode, setCurrentMode] = useState<'profile' | 'settings' | 'languages' | 'status' | 'offer' | 'privacy' | 'contacts' | 'paywall' | 'login'>('profile');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [myAd, setMyAd] = useState<any>(null); // State for user's ad
    const [devTapCount, setDevTapCount] = useState(0);
    const [isDevMode, setIsDevMode] = useState(false);

    const [pendingPayment, setPendingPayment] = useState(false);

    // Nickname editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user.name);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState(user.nickname || '');
    const [nicknameError, setNicknameError] = useState('');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState(user.bio || '');
    const [isEditingServices, setIsEditingServices] = useState(false);
    const [newService, setNewService] = useState('');
    const [services, setServices] = useState<string[]>(user.services || []);

    const handleSaveName = async () => {
        if (!newName.trim() || newName === user.name) {
            setIsEditingName(false);
            setNewName(user.name);
            return;
        }

        const updatedUser = { ...user, name: newName.trim() };

        // Update parent state
        if (onUpdateUser) onUpdateUser(updatedUser);

        // Save to localStorage
        localStorage.setItem('x5_user', JSON.stringify(updatedUser));

        // Save to Firestore
        if (user.id && !user.isGuest) {
            try {
                await db.collection('users').doc(user.id).set({ name: newName.trim() }, { merge: true });
            } catch (e) {
                console.error("Failed to save name to Firestore", e);
            }
        }

        setIsEditingName(false);
    };

    const handleSaveNickname = async () => {
        const nick = newNickname.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!nick || nick.length < 3) {
            setNicknameError('Минимум 3 символа (a-z, 0-9, _)');
            return;
        }
        if (nick === user.nickname) {
            setIsEditingNickname(false);
            return;
        }

        // Check uniqueness
        if (user.id && !user.isGuest) {
            try {
                const existing = await db.collection('users').where('nickname', '==', nick).get();
                if (!existing.empty && existing.docs[0].id !== user.id) {
                    setNicknameError('Этот никнейм уже занят');
                    return;
                }

                await db.collection('users').doc(user.id).set({ nickname: nick }, { merge: true });
                const updatedUser = { ...user, nickname: nick };
                if (onUpdateUser) onUpdateUser(updatedUser);
                localStorage.setItem('x5_user', JSON.stringify(updatedUser));
                setNicknameError('');
            } catch (e) {
                console.error("Failed to save nickname", e);
            }
        }

        setIsEditingNickname(false);
    };

    const handleSaveBio = async () => {
        const bio = newBio.trim();
        if (user.id && !user.isGuest) {
            try {
                await db.collection('users').doc(user.id).set({ bio }, { merge: true });
                const updatedUser = { ...user, bio };
                if (onUpdateUser) onUpdateUser(updatedUser);
                localStorage.setItem('x5_user', JSON.stringify(updatedUser));
            } catch (e) {
                console.error("Failed to save bio", e);
            }
        }
        setIsEditingBio(false);
    };

    const handleAddService = async () => {
        const svc = newService.trim();
        if (!svc) return;
        const updated = [...services, svc];
        setServices(updated);
        setNewService('');
        if (user.id && !user.isGuest) {
            try {
                await db.collection('users').doc(user.id).set({ services: updated }, { merge: true });
                const updatedUser = { ...user, services: updated };
                if (onUpdateUser) onUpdateUser(updatedUser);
                localStorage.setItem('x5_user', JSON.stringify(updatedUser));
            } catch (e) {
                console.error("Failed to save services", e);
            }
        }
    };

    const handleRemoveService = async (idx: number) => {
        const updated = services.filter((_, i) => i !== idx);
        setServices(updated);
        if (user.id && !user.isGuest) {
            try {
                await db.collection('users').doc(user.id).set({ services: updated }, { merge: true });
                const updatedUser = { ...user, services: updated };
                if (onUpdateUser) onUpdateUser(updatedUser);
                localStorage.setItem('x5_user', JSON.stringify(updatedUser));
            } catch (e) {
                console.error("Failed to save services", e);
            }
        }
    };

    const handleCancelEdit = () => {
        setNewName(user.name);
        setIsEditingName(false);
    };

    useEffect(() => {
        const devStatus = localStorage.getItem('x5_dev_mode') === 'true';
        setIsDevMode(devStatus);

        if (user?.id && !user.isGuest) {
            // 1. Subscribe to History
            const unsubscribeHistory = subscribeToHistory(user.id, 'all', (items) => {
                setHistory(items);
            });

            // 2. Fetch User's Ad (Specialist Profile)
            const fetchMyAd = async () => {
                try {
                    const doc = await db.collection('specialists').doc(user.id).get();
                    if (doc.exists) {
                        setMyAd(doc.data());
                    } else {
                        setMyAd(null);
                    }
                } catch (e) {
                    console.error("Error fetching ad", e);
                }
            };
            fetchMyAd();

            return () => unsubscribeHistory();
        }
    }, [user?.id, currentMode]);

    // Handle Tab Bar Visibility based on mode
    useEffect(() => {
        if (onToggleTabBar) {
            // Show dock ONLY when in main 'profile' screen
            onToggleTabBar(currentMode === 'profile');
        }
        return () => {
            // Safety: restore dock when unmounting (leaving profile view entirely)
            if (onToggleTabBar) onToggleTabBar(true);
        };
    }, [currentMode, onToggleTabBar]);

    const handleDevTap = () => {
        const newCount = devTapCount + 1;
        setDevTapCount(newCount);
        if (navigator.vibrate) navigator.vibrate(50);
        if (newCount >= 10) {
            setCurrentMode('status');
            setDevTapCount(0);
        }
    };

    const handleBuyCredits = () => {
        const { action, params } = getPaymentData(100, user.email);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = action;
        form.enctype = 'multipart/form-data';
        Object.entries(params).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };



    const handlePaymentAccess = () => {
        if (user.isGuest) {
            setPendingPayment(true);
            setCurrentMode('login');
        } else {
            setCurrentMode('paywall');
        }
    };

    const handleDeleteAd = async () => {
        if (!user?.id) return;
        if (confirm(t('profile_delete_confirm', language))) {
            try {
                await db.collection('specialists').doc(user.id).delete();
                setMyAd(null);
            } catch (e) {
                alert(t('profile_delete_error', language));
            }
        }
    };

    const getIconForType = (type: string) => {
        return <History size={18} className="text-slate-600" />;
    };

    // --- LOGIN MODE ---
    if (currentMode === 'login') {
        return (
            <LoginView
                onLogin={(u) => {
                    if (onUpdateUser) onUpdateUser(u);
                    if (pendingPayment) {
                        setPendingPayment(false);
                        setCurrentMode('paywall');
                    } else {
                        setCurrentMode('profile');
                    }
                }}
                onCancel={() => {
                    setPendingPayment(false);
                    setCurrentMode('profile');
                }}
                language={language}
                platform={platform}
                isModal={true}
            />
        );
    }

    // --- SUB VIEWS ---
    if (currentMode === 'settings') return (
        <SettingsView
            language={language}
            onClose={() => setCurrentMode('profile')}
            onNavigateTo={(m) => setCurrentMode(m as any)}
            onLogout={onLogout}
            onDevTap={handleDevTap}
            platform={platform}
            onPlatformChange={onPlatformChange}
            isDevMode={isDevMode}
        />
    );
    if (currentMode === 'contacts') return <SupportView language={language} onBack={() => setCurrentMode('settings')} />;
    if (currentMode === 'offer') return <LegalView type="offer" language={language} onBack={() => setCurrentMode('settings')} />;
    if (currentMode === 'privacy') return <LegalView type="privacy" language={language} onBack={() => setCurrentMode('settings')} />;
    if (currentMode === 'status') return <ApiManagerView onBack={() => setCurrentMode('settings')} />;
    if (currentMode === 'languages') return (
        <LanguageView
            currentLanguage={language}
            onSelect={(l) => { setLanguage(l); setCurrentMode('settings'); }}
            onBack={() => setCurrentMode('settings')}
        />
    );

    if (currentMode === 'paywall') return (
        <PaywallView
            language={language}
            onClose={() => setCurrentMode('profile')}
            onBuy={handleBuyCredits}
            platform={platform}
            user={user}
        />
    );

    return (
        <div className="flex flex-col h-full animate-fade-in px-5 pt-12 pb-32 overflow-y-auto no-scrollbar bg-[#f2f4f6] relative">

            {/* Hide Admin Key unless dev mode is active */}
            {isDevMode && (
                <div className="hidden md:block absolute top-6 left-6 z-50">
                    <button onClick={() => onNavigate && onNavigate('admin_key')} className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-200 transition-colors shadow-sm">
                        <Key size={12} />
                        <span>Admin Key</span>
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-4 shrink-0">
                <h1 className="text-2xl font-black text-slate-900">{t('profile_title', language)}</h1>
                <button onClick={() => setCurrentMode('settings')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600 active:scale-95 transition-transform"><Settings size={20} /></button>
            </div>

            {/* --- GUEST CARD VS USER HEADER --- */}
            {user.isGuest ? (
                <div className="w-full bg-white rounded-[28px] p-5 shadow-xl shadow-slate-200/50 mb-4 border border-white relative overflow-hidden text-center group shrink-0">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                    <div className="mb-3 relative inline-block">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto border border-slate-100">
                            <UserIcon size={28} />
                        </div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white">?</div>
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900 mb-1 leading-tight">{t('profile_login_promo', language)}</h2>
                    <p className="text-xs text-slate-500 font-medium mb-5 max-w-[220px] mx-auto leading-relaxed">
                        {t('profile_login_desc', language)}
                    </p>

                    <button
                        onClick={() => setCurrentMode('login')}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-[20px] font-bold text-base shadow-xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <LogIn size={18} />
                        <span>{t('profile_login_btn', language)}</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center mb-6 relative shrink-0">
                    <div className="w-20 h-20 rounded-full p-1 bg-white shadow-xl mb-3 relative">
                        <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}
                        </div>
                        {user.plan !== 'free' && <div className="absolute -bottom-1 -right-1 bg-black text-white p-1 rounded-full border-2 border-white"><Crown size={10} className="fill-yellow-400 text-yellow-400" /></div>}
                    </div>
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 text-center w-40"
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                                <Check size={14} />
                            </button>
                            <button onClick={handleCancelEdit} className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-300 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                            <h1 className="text-xl font-black text-slate-900">{user.name}</h1>
                            <Pencil size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                    )}
                    {/* Nickname */}
                    {isEditingNickname ? (
                        <div className="flex flex-col items-center gap-1 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm font-bold">@</span>
                                <input
                                    type="text"
                                    value={newNickname}
                                    onChange={(e) => { setNewNickname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setNicknameError(''); }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveNickname();
                                        if (e.key === 'Escape') { setIsEditingNickname(false); setNicknameError(''); }
                                    }}
                                    placeholder="nickname"
                                    className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 text-center w-36"
                                    autoFocus
                                />
                                <button onClick={handleSaveNickname} className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center"><Check size={12} /></button>
                                <button onClick={() => { setIsEditingNickname(false); setNicknameError(''); }} className="w-7 h-7 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center"><X size={12} /></button>
                            </div>
                            {nicknameError && <p className="text-[10px] text-red-500 font-bold">{nicknameError}</p>}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 mt-0.5 cursor-pointer group" onClick={() => { setIsEditingNickname(true); setNewNickname(user.nickname || ''); }}>
                            <span className="text-xs font-bold text-slate-400">
                                {user.nickname ? `@${user.nickname}` : 'Добавить никнейм'}
                            </span>
                            <Pencil size={10} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                    )}
                    <span className={`mt-1 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${user.plan === 'free' ? 'bg-slate-200 text-slate-500' : 'bg-black text-white'}`}>
                        {user.plan === 'free' ? t('profile_sub_basic', language) : t('profile_sub_pro', language)}
                    </span>
                    {user.plan === 'pro' && user.subscriptionEndDate && (
                        <span className="text-[9px] text-slate-400 font-bold mt-1 tracking-tight">
                            {t('active_until', language)}: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                        </span>
                    )}
                    {user.plan === 'pro' && !user.subscriptionEndDate && user.subscriptionDate && (
                        <span className="text-[9px] text-slate-400 font-bold mt-1 tracking-tight">
                            Since: {new Date(user.subscriptionDate).toLocaleDateString()}
                        </span>
                    )}
                </div>
            )}

            {/* Company Mode Toggle */}
            {!user.isGuest && (
                <div className="w-full bg-white rounded-[28px] p-4 shadow-lg shadow-slate-200/40 border border-slate-100 mb-5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.isCompany ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                <Building2 size={18} className={user.isCompany ? 'text-blue-600' : 'text-slate-400'} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Я — компания</p>
                                <p className="text-[10px] text-slate-500">Режим для бизнеса</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                const newVal = !user.isCompany;
                                if (user.id && !user.isGuest) {
                                    try {
                                        await db.collection('users').doc(user.id).set({ isCompany: newVal }, { merge: true });
                                        const updatedUser = { ...user, isCompany: newVal };
                                        if (onUpdateUser) onUpdateUser(updatedUser);
                                        localStorage.setItem('x5_user', JSON.stringify(updatedUser));
                                    } catch (e) { console.error("Failed to toggle company", e); }
                                }
                            }}
                            className={`w-12 h-7 rounded-full relative transition-colors ${user.isCompany ? 'bg-blue-500' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${user.isCompany ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                    {user.isCompany && (
                        <button
                            onClick={() => { if (onNavigate) onNavigate('business' as any); }}
                            className="mt-3 w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Building2 size={14} /> Посмотреть лендинг X5 для бизнеса
                        </button>
                    )}
                </div>
            )}

            {/* BIO & SERVICES — Profile Packaging */}
            {!user.isGuest && (
                <div className="w-full bg-white rounded-[28px] p-5 shadow-lg shadow-slate-200/40 border border-slate-100 mb-5 shrink-0">
                    {/* Bio */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">О себе</h4>
                            {!isEditingBio && (
                                <button onClick={() => { setIsEditingBio(true); setNewBio(user.bio || ''); }} className="text-slate-400 hover:text-slate-600">
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>
                        {isEditingBio ? (
                            <div className="space-y-2">
                                <textarea
                                    value={newBio}
                                    onChange={(e) => setNewBio(e.target.value)}
                                    placeholder="Расскажите о себе, опыте, навыках..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:border-blue-400"
                                    rows={3}
                                    maxLength={300}
                                    autoFocus
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400">{newBio.length}/300</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingBio(false)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Отмена</button>
                                        <button onClick={handleSaveBio} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">Сохранить</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {user.bio || <span className="text-slate-400 italic">Нажмите чтобы добавить описание</span>}
                            </p>
                        )}
                    </div>

                    {/* Services / Skills */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Услуги</h4>
                            <button onClick={() => setIsEditingServices(!isEditingServices)} className="text-slate-400 hover:text-slate-600">
                                {isEditingServices ? <Check size={12} /> : <Pencil size={12} />}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {services.map((svc, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                                    {svc}
                                    {isEditingServices && (
                                        <button onClick={() => handleRemoveService(idx)} className="text-slate-400 hover:text-red-500 ml-0.5">
                                            <X size={10} />
                                        </button>
                                    )}
                                </span>
                            ))}
                            {services.length === 0 && !isEditingServices && (
                                <span className="text-xs text-slate-400 italic">Добавьте свои услуги</span>
                            )}
                        </div>
                        {isEditingServices && (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    value={newService}
                                    onChange={(e) => setNewService(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                                    placeholder="Дизайн, SMM, Видео..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                />
                                <button onClick={handleAddService} className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0">
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Registration Date */}
                    {user.createdAt && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                            <Calendar size={12} className="text-slate-400" />
                            <span className="text-[10px] text-slate-400 font-bold">
                                На платформе с {new Date(user.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* CREDITS CARD (Show for everyone) */}
            <div className="mb-6 shrink-0">
                <div className="w-full bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-bl-[60px] -mr-6 -mt-6 opacity-80"></div>

                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 relative z-10">{t('profile_credits', language)}</p>

                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <h3 className="text-[42px] font-black text-slate-900 leading-none tracking-tighter">{user?.credits || 0}</h3>
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Zap size={20} className="text-yellow-500 fill-yellow-500" />
                        </div>
                    </div>

                    <button
                        onClick={handlePaymentAccess}
                        className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-[20px] text-[15px] transition-all active:scale-95 border border-slate-100 flex items-center justify-center relative z-10"
                    >
                        {user.plan === 'free' ? t('profile_upgrade', language) : t('profile_buy', language)}
                    </button>
                </div>
            </div>

            {/* STATS GRID */}
            {!user.isGuest && (
                <>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-3">{t('profile_stats', language)}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/60 p-4 rounded-[24px] border border-white shadow-sm flex flex-col">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                <History size={16} />
                            </div>
                            <span className="text-2xl font-extrabold text-slate-900">{history.length}</span>
                            <span className="text-[10px] text-slate-500 font-bold">{t('profile_contracts', language)}</span>
                        </div>
                        <div className="bg-white/60 p-4 rounded-[24px] border border-white shadow-sm flex flex-col">
                            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-2">
                                <Zap size={16} />
                            </div>
                            <span className="text-2xl font-extrabold text-slate-900">{user.credits || 0}</span>
                            <span className="text-[10px] text-slate-500 font-bold">{t('profile_creatives', language)}</span>
                        </div>
                    </div>
                </>
            )}

            {/* USER ADS (MY LISTINGS) */}
            {!user.isGuest && myAd && (
                <div className="mb-6">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-3">{t('profile_my_ads', language)}</h3>
                    <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0">
                                <Briefcase size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">{myAd.role}</h4>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{myAd.categoryId || 'General'}</p>
                            </div>
                            <button
                                onClick={handleDeleteAd}
                                className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                            <div className="flex items-center gap-1.5">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-bold text-slate-800">{myAd.rating || 5.0}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-900">{myAd.price}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY */}
            <div className="flex-1 space-y-3 pb-4">
                {history.length > 0 && <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-1">{t('profile_history', language)}</h3>}
                {history.map((item) => (
                    <div key={item.id} onClick={() => onRestoreHistory && onRestoreHistory(item)} className="bg-white p-3.5 rounded-[22px] shadow-sm border border-slate-100 flex items-center gap-3 active:scale-[0.98] cursor-pointer">
                        <div className="w-10 h-10 rounded-[16px] bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500">{getIconForType(item.type)}</div>
                        <div className="flex-1 min-w-0"><h4 className="text-xs font-bold text-slate-900 truncate">{item.prompt || 'Untitled'}</h4></div>
                        <ChevronRight size={14} className="text-slate-300" />
                    </div>
                ))}
                {history.length === 0 && !user.isGuest && (
                    <div className="text-center py-8 opacity-50">
                        <p className="text-xs text-slate-400 font-medium">{t('profile_history_empty', language)}</p>
                    </div>
                )}
                {user.isGuest && history.length === 0 && (
                    <div className="text-center py-4 opacity-40">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('profile_history_guest', language)}</p>
                    </div>
                )}
            </div>

            {/* Platform Info Footer */}
            <div className="text-center pb-6 opacity-30">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {t('logged_via', language)}: <span className="text-slate-600">{platform === 'ios' ? 'iOS App' : platform === 'android' ? 'Android App' : 'Web Browser'}</span>
                </p>
            </div>
        </div>
    );
};
