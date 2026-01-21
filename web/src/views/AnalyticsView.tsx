
import React, { useState, useEffect } from 'react';
import { BarChart2, Link as LinkIcon, Instagram, Youtube, Globe, Copy, Check, Lock, MousePointer2, ChevronLeft } from 'lucide-react';
import { ViewProps, LinkData } from '../types';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import { t } from '../services/translations';

export const AnalyticsView: React.FC<ViewProps> = ({ user, onNavigate, onBack, language = 'ru' }) => {
  const [urlInput, setUrlInput] = useState('');
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    
    // Simple validation
    let cleanUrl = urlInput;
    if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
    }

    const baseId = Math.random().toString(36).substr(2, 6);
    const platforms: Array<'instagram' | 'youtube' | 'tiktok' | 'site'> = ['instagram', 'youtube', 'tiktok', 'site'];
    
    const batch = db.batch();

    platforms.forEach(platform => {
        const linkId = `${baseId}-${platform}`;
        const ref = db.collection('users').doc(user.id).collection('links').doc(linkId);
        
        const shortUrl = `x5.app/${platform.substring(0,2)}/${baseId}`; // Simulation of a short link
        
        batch.set(ref, {
            platform,
            originalUrl: cleanUrl,
            trackingUrl: shortUrl,
            clicks: Math.floor(Math.random() * 5), // Simulating initial test clicks
            date: new Date().toISOString()
        });
    });

    await batch.commit();
    setUrlInput('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const simulateClick = async (link: LinkData) => {
      if(!user?.id) return;
      await db.collection('users').doc(user.id).collection('links').doc(link.id).update({
          clicks: firebase.firestore.FieldValue.increment(1)
      });
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
            disabled={!urlInput}
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-[20px] font-bold text-sm transition-all shadow-md ${!urlInput ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white active:scale-95'}`}
          >
            {t('analytics_btn_create', language)}
          </button>
      </div>

      {/* Stats List */}
      <div className="space-y-4">
          {links.length > 0 ? (
              links.map((link) => (
                  <div key={link.id} className="glass-card p-5 rounded-[24px] bg-white border border-white shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform">
                      <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 rounded-[18px] bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                              {getPlatformIcon(link.platform)}
                          </div>
                          <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{link.platform}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900 truncate font-mono bg-slate-100 px-2 py-0.5 rounded-md">{link.trackingUrl}</p>
                                <button onClick={() => copyToClipboard(link.trackingUrl, link.id)} className="text-slate-400 hover:text-slate-900">
                                    {copiedId === link.id ? <Check size={14}/> : <Copy size={14}/>}
                                </button>
                              </div>
                          </div>
                      </div>
                      
                      <div className="flex flex-col items-end pl-2" onClick={() => simulateClick(link)}>
                          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 cursor-pointer hover:bg-green-100 transition-colors">
                              <MousePointer2 size={12} className="text-green-600" />
                              <span className="text-sm font-black text-green-700">{link.clicks}</span>
                          </div>
                          <span className="text-[9px] text-slate-300 mt-1 font-medium">{t('analytics_clicks', language)}</span>
                      </div>
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
