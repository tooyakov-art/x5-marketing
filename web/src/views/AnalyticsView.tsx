
import React, { useState, useEffect } from 'react';
import { BarChart2, Link as LinkIcon, Instagram, Youtube, Globe, Copy, Check, Lock, MousePointer2, ChevronLeft, ExternalLink, Trash2 } from 'lucide-react';
import { ViewProps, LinkData } from '../types';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import { t } from '../services/translations';
import { useToast } from '../components/Toast';

// Base URL for tracking redirects
const TRACKING_BASE_URL = 'https://x5-marketing-app.web.app/r/';

// Generate a unique short code
const generateShortCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const AnalyticsView: React.FC<ViewProps> = ({ user, onNavigate, onBack, language = 'ru' }) => {
  const { showToast } = useToast();
  const [urlInput, setUrlInput] = useState('');
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load links from Firestore
  useEffect(() => {
    if (user?.id && !user.isGuest) {
      setLoading(true);
      const unsubscribe = db.collection('users').doc(user.id).collection('links')
        .orderBy('date', 'desc')
        .onSnapshot(snapshot => {
          const loadedLinks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as LinkData[];
          setLinks(loadedLinks);
          setLoading(false);
        });
      return () => unsubscribe();
    }
  }, [user?.id]);

  const generateLinks = async () => {
    if (!urlInput || !user?.id) return;

    // URL Validation
    let cleanUrl = urlInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Validate URL format
    try {
      new URL(cleanUrl);
    } catch {
      showToast(language === 'ru' ? 'Неверный формат URL' : 'Invalid URL format', 'error');
      return;
    }

    setIsCreating(true);

    try {
      const platforms: Array<'instagram' | 'youtube' | 'tiktok' | 'site'> = ['instagram', 'youtube', 'tiktok', 'site'];
      const batch = db.batch();

      for (const platform of platforms) {
        const shortCode = generateShortCode();
        const linkId = `${shortCode}-${platform}`;

        // Store in user's links collection
        const userLinkRef = db.collection('users').doc(user.id).collection('links').doc(linkId);

        // Store in global tracking collection for redirect lookup
        const trackingRef = db.collection('tracking_links').doc(shortCode);

        const linkData = {
          platform,
          originalUrl: cleanUrl,
          trackingUrl: `${TRACKING_BASE_URL}${shortCode}`,
          shortCode,
          clicks: 0,
          date: new Date().toISOString(),
          userId: user.id
        };

        batch.set(userLinkRef, linkData);
        batch.set(trackingRef, {
          originalUrl: cleanUrl,
          userId: user.id,
          linkId,
          platform,
          clicks: 0,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      setUrlInput('');
      showToast(language === 'ru' ? 'Ссылки созданы!' : 'Links created!', 'success');
    } catch (error) {
      console.error('Error creating links:', error);
      showToast(language === 'ru' ? 'Ошибка создания ссылок' : 'Error creating links', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteLink = async (linkId: string, shortCode: string) => {
    if (!user?.id) return;

    try {
      const batch = db.batch();
      batch.delete(db.collection('users').doc(user.id).collection('links').doc(linkId));
      batch.delete(db.collection('tracking_links').doc(shortCode));
      await batch.commit();
      showToast(language === 'ru' ? 'Ссылка удалена' : 'Link deleted', 'success');
    } catch (error) {
      console.error('Error deleting link:', error);
      showToast(language === 'ru' ? 'Ошибка удаления' : 'Error deleting', 'error');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(language === 'ru' ? 'Скопировано!' : 'Copied!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getPlatformIcon = (p: string) => {
      switch(p) {
          case 'instagram': return <Instagram size={20} className="text-pink-600" />;
          case 'youtube': return <Youtube size={20} className="text-red-600" />;
          case 'tiktok': return <span className="text-lg font-bold text-black">Tik</span>; 
          default: return <Globe size={20} className="text-blue-600" />;
      }
  };

  if (user?.isGuest) {
      return (
          <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 items-center justify-center text-center">
              <div className="absolute top-16 left-6">
                  <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-slate-100">
                      <ChevronLeft size={22} className="text-slate-900" />
                  </button>
              </div>
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Lock size={40} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{t('analytics_locked_title', language)}</h2>
              <p className="text-slate-500 max-w-xs mb-8 font-medium">
                  {t('analytics_locked_desc', language)}
              </p>
              <button 
                onClick={() => onNavigate && onNavigate('profile')} 
                className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-bold shadow-xl active:scale-95 transition-transform"
              >
                  {t('profile_login_promo', language)}
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto bg-[#f2f4f6]">
      <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100">
                <ChevronLeft className="text-slate-900" size={22} />
            </button>
            <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{t('analytics_title', language)}</h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{t('analytics_subtitle', language)}</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <BarChart2 size={20} className="text-slate-900" />
          </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-2 rounded-[28px] shadow-xl border border-slate-100 mb-8 relative">
          <input 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t('analytics_input', language)}
            className="w-full h-14 pl-6 pr-4 rounded-[24px] bg-white text-slate-900 font-medium focus:outline-none placeholder-slate-400"
          />
          <button
            onClick={generateLinks}
            disabled={!urlInput || isCreating}
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-[20px] font-bold text-sm transition-all shadow-md ${!urlInput || isCreating ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white active:scale-95'}`}
          >
            {isCreating ? (language === 'ru' ? 'Создаем...' : 'Creating...') : t('analytics_btn_create', language)}
          </button>
      </div>

      {/* Stats List */}
      <div className="space-y-4">
          {links.length > 0 ? (
              links.map((link) => (
                  <div key={link.id} className="glass-card p-5 rounded-[24px] bg-white border border-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                  {getPlatformIcon(link.platform)}
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{link.platform}</p>
                                  <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                      <MousePointer2 size={10} className="text-green-600" />
                                      <span className="text-xs font-bold text-green-700">{link.clicks || 0} {t('analytics_clicks', language)}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center gap-2">
                              <button
                                onClick={() => openLink(link.originalUrl)}
                                className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              >
                                  <ExternalLink size={14} />
                              </button>
                              <button
                                onClick={() => deleteLink(link.id, (link as any).shortCode)}
                                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                              >
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </div>

                      {/* Tracking URL */}
                      <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                          <p className="text-xs font-mono text-slate-600 truncate flex-1">{link.trackingUrl}</p>
                          <button
                            onClick={() => copyToClipboard(link.trackingUrl, link.id)}
                            className="ml-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                          >
                              {copiedId === link.id ? <Check size={12}/> : <Copy size={12}/>}
                              <span>{copiedId === link.id ? (language === 'ru' ? 'Скопировано' : 'Copied') : (language === 'ru' ? 'Копировать' : 'Copy')}</span>
                          </button>
                      </div>

                      {/* Original URL */}
                      <p className="text-[10px] text-slate-400 mt-2 truncate">
                          → {link.originalUrl}
                      </p>
                  </div>
              ))
          ) : (
              <div className="text-center py-10 opacity-50">
                  <LinkIcon size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-400">{t('analytics_empty', language)}</p>
              </div>
          )}
      </div>
    </div>
  );
};
