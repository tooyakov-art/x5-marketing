
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewProps, CreativeHook } from '../types';
import { generateMarketingHooks } from '../services/geminiService';
import { VideoSetup } from './video_parts/VideoSetup';
import { VideoGrid } from './video_parts/VideoGrid';
import { VideoEditor } from './video_parts/VideoEditor';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';

// Debounce helper to prevent spamming the database
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const VideoCreativeView: React.FC<ViewProps> = ({ user, onBack, checkUsage, initialPrompt, language = 'ru' }) => {
  const [viewMode, setViewMode] = useState<'setup' | 'grid' | 'editor'>('setup');
  
  // STATE
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null); // Optimization: Grid Thumbnail
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [hooks, setHooks] = useState<CreativeHook[]>([]);
  const [activeHookId, setActiveHookId] = useState<number | null>(null);
  
  // Initialize prompt with prop, but it will likely be empty due to App.tsx fix unless explicitly restored via history
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Flag to know if we are currently restoring data to prevent overwriting DB immediately
  const [isRestoring, setIsRestoring] = useState(false);

  // CLOUD SAVING: Watch for changes
  const debouncedHooks = useDebounce(hooks, 2000);
  const debouncedPrompt = useDebounce(prompt, 2000);

  // FORCE RESET ON MOUNT IF NO INITIAL PROMPT (Double safety)
  useEffect(() => {
      if (!initialPrompt) {
          setPrompt('');
          setHooks([]);
      }
  }, [initialPrompt]);

  // 1. MANUAL RESTORE FUNCTION
  const handleRestoreDraft = async () => {
      if (!user?.id) return;
      setIsRestoring(true);
      try {
          const doc = await db.collection('users').doc(user.id).collection('drafts').doc('video_main').get();
          if (doc.exists) {
              const data = doc.data();
              if (data) {
                  if (data.prompt) setPrompt(data.prompt);
                  if (data.hooks) setHooks(data.hooks);
                  // Note: Media URL is local blob, cannot restore. User must re-upload video.
                  // But we show the grid if hooks exist so they can see text.
                  if (data.hooks && data.hooks.length > 0) setViewMode('grid');
                  alert("Черновик восстановлен. Пожалуйста, загрузите видео заново.");
              }
          } else {
              alert("Нет сохраненных черновиков.");
          }
      } catch (e) {
          console.error("Failed to load draft", e);
      } finally {
          // Allow saving again after a short delay
          setTimeout(() => setIsRestoring(false), 3000);
      }
  };

  // 2. AUTO-SAVE TO FIREBASE
  useEffect(() => {
      if (!user?.id || isRestoring) return;
      
      // Don't save empty states over existing data
      if (hooks.length === 0 && !prompt) return;

      const saveDraft = async () => {
          try {
              await db.collection('users').doc(user.id).collection('drafts').doc('video_main').set({
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                  prompt: debouncedPrompt,
                  hooks: debouncedHooks
              }, { merge: true });
          } catch (e) {
              console.error("Save failed", e);
          }
      };
      saveDraft();
  }, [debouncedHooks, debouncedPrompt, user?.id, isRestoring]);

  // CLEANUP RESOURCE LEAKS
  useEffect(() => {
      return () => {
          if (mediaUrl) URL.revokeObjectURL(mediaUrl);
      };
  }, []); // Only on unmount

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous URL to prevent memory leak
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);

      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      const isVideo = file.type.startsWith('video');
      setMediaType(isVideo ? 'video' : 'image');

      if (isVideo) {
          // GENERATE LIGHTWEIGHT THUMBNAIL
          const video = document.createElement('video');
          video.src = url;
          video.muted = true;
          video.playsInline = true;
          video.currentTime = 0.5; 
          video.crossOrigin = "anonymous";
          
          await new Promise((resolve) => {
              video.onloadeddata = () => {
                  video.currentTime = 0.5; 
              };
              video.onseeked = () => {
                  const canvas = document.createElement('canvas');
                  const w = 320;
                  const h = video.videoHeight * (w / video.videoWidth);
                  canvas.width = w;
                  canvas.height = h;
                  
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      ctx.drawImage(video, 0, 0, w, h);
                      setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.6));
                  }
                  resolve(null);
              };
              video.onerror = () => resolve(null);
          });
          video.remove();
      } else {
          setThumbnailUrl(null);
      }
    }
  };

  const handleGenerate = async (quantity: number = 4, append: boolean = false) => {
    if (!prompt) return; 
    
    // Check credits
    if (checkUsage && !checkUsage('standard', 2)) return;

    setIsGenerating(true);
    try {
        const res = await generateMarketingHooks(prompt, quantity);
        setHooks(prev => append ? [...prev, ...res] : res);
        setViewMode('grid');
    } catch (e) {
        alert("Ошибка генерации");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleUpdateHook = (updatedHook: CreativeHook) => {
      setHooks(prevHooks => prevHooks.map(h => 
          h.id === updatedHook.id ? updatedHook : h
      ));
      setViewMode('grid');
  };

  const activeHook = hooks.find(h => h.id === activeHookId);
  const isFreePlan = user?.plan === 'free';

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
        {viewMode === 'setup' && (
            <VideoSetup 
                mediaUrl={mediaUrl} prompt={prompt} setPrompt={setPrompt}
                onUpload={handleMediaUpload} 
                onGenerate={(qty) => handleGenerate(qty, false)} 
                isGenerating={isGenerating} onBack={onBack}
                onRestoreHistory={handleRestoreDraft}
                user={user}
                language={language}
            />
        )}

        {viewMode === 'grid' && (
            <VideoGrid 
                mediaUrl={mediaUrl} mediaType={mediaType} hooks={hooks}
                thumbnailUrl={thumbnailUrl} 
                onSelect={(id, styleId) => { 
                    if (styleId) {
                        setHooks(prev => prev.map(h => h.id === id ? { ...h, styleId } : h));
                    }
                    setActiveHookId(id); 
                    setViewMode('editor'); 
                }}
                onBack={() => setViewMode('setup')} 
                onGenerateMore={() => handleGenerate(4, true)} 
                isGenerating={isGenerating}
                needsWatermark={isFreePlan}
            />
        )}

        {viewMode === 'editor' && activeHook && (
            <VideoEditor 
                mediaUrl={mediaUrl} mediaType={mediaType} 
                initialHook={activeHook} 
                onSave={handleUpdateHook} 
                onBack={() => setViewMode('grid')}
            />
        )}
    </div>
  );
};
