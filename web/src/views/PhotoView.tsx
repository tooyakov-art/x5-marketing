
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, XCircle, Camera, Shirt, ShoppingBag, Zap, ImagePlus, ChevronLeft, History, ArrowRight, Wand2, Maximize2, Share2, Heart, X, Plus, Cpu, Send, Square, RectangleHorizontal, RectangleVertical, Smartphone, Monitor, Box, Aperture, Grid2X2, Package, Tag, Briefcase, Coffee, Truck, Upload, Edit3, Eraser, PenTool, ZoomIn, ZoomOut, Lock } from 'lucide-react';
import { generateImage, improvePrompt } from '../services/geminiService';
import { PhotoMode, HistoryItem, ViewProps } from '../types';
import { saveToHistory, subscribeToHistory } from '../services/historyService';
import { LoadingSpinner } from '../components/GlassComponents';
import { t } from '../services/translations';

interface SessionImage {
    id: string;
    url: string;
    aspectRatio: string;
    tier: 'standard' | 'pro';
}

interface PhotoViewProps extends ViewProps {
    initialMode?: PhotoMode;
}

export const PhotoView: React.FC<PhotoViewProps> = ({ user, onBack, initialPrompt, checkUsage, deductCredits, initialMode, onNavigate, initialImage, language = 'ru' }) => {
  // Always default to passed mode or 'studio' if null
  const [mode, setMode] = useState<PhotoMode>(initialMode || 'studio');
  
  // Update mode if prop changes
  useEffect(() => {
      if (initialMode) setMode(initialMode);
  }, [initialMode]);

  // Force 1:1 for Logo
  useEffect(() => {
      if (mode === 'logo') {
          setAspectRatio('1:1');
      }
  }, [mode]);

  // Load initial image for branding if passed
  useEffect(() => {
      if (initialImage && mode === 'branding') {
          if (initialImage.startsWith('data:')) {
              setReferenceImages([initialImage.split(',')[1]]);
          } else {
              fetch(initialImage)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setReferenceImages([(reader.result as string).split(',')[1]]);
                    };
                    reader.readAsDataURL(blob);
                });
          }
      }
  }, [initialImage, mode]);

  // --- STATE ---
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '3:4' | '4:3'>('9:16');
  const [modelTier, setModelTier] = useState<'standard' | 'pro'>('standard');
  const [tierAnimating, setTierAnimating] = useState(false); // Animation state
  
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  
  const [sessionImages, setSessionImages] = useState<SessionImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Viewer & Edit State
  const [viewImage, setViewImage] = useState<SessionImage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for Pinch Zoom
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);

  const isFreePlan = user?.plan === 'free';

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = subscribeToHistory(user.id, 'photo', (items) => {
        setHistory(items);
      });
      return () => unsubscribe();
    }
  }, [user?.id]);

  const handleInputFocus = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
  };

  const handleTierSwitch = (tier: 'standard' | 'pro') => {
      if (tier === 'pro' && user?.plan === 'free') {
          alert(t('photo_alert_pro', language));
          return;
      }
      if (tier === modelTier) return;
      setModelTier(tier);
      setTierAnimating(true);
      setTimeout(() => setTierAnimating(false), 600);
  };

  const modes: {id: PhotoMode, label: string, icon: any}[] = [
    { id: 'studio', label: t('photo_mode_studio', language), icon: Camera },
    { id: 'lookbook', label: t('photo_mode_lookbook', language), icon: Shirt },
    { id: 'product', label: t('photo_mode_product', language), icon: ShoppingBag },
    { id: 'creative', label: t('photo_mode_creative', language), icon: Zap },
    { id: 'cyber', label: t('photo_mode_cyber', language), icon: Aperture },
    { id: 'logo', label: t('photo_mode_logo', language), icon: Box },
    { id: 'branding', label: t('photo_mode_branding', language), icon: Tag },
  ];

  const brandingMockups = [
      { id: 'business_card', label: t('photo_branding_card', language), icon: RectangleHorizontal, prompt: "Professional business card mockup, minimalistic design, high quality paper texture, photorealistic, logo on center" },
      { id: 'tshirt', label: t('photo_branding_merch', language), icon: Shirt, prompt: "White streetwear hoodie mockup on a hanger, clean studio background, high quality fabric details, logo printed on chest" },
      { id: 'sign', label: t('photo_branding_sign', language), icon: Square, prompt: "3D wall signage mockup, modern office interior, acrylic glass sign with LED backlight, logo on the sign" },
      { id: 'cup', label: t('photo_branding_cup', language), icon: Coffee, prompt: "Paper coffee cup mockup on a wooden table, cafe atmosphere, soft lighting, logo printed on the cup" },
      { id: 'van', label: t('photo_branding_van', language), icon: Truck, prompt: "Delivery van wrap mockup, side view, clean white van, studio lighting, branding logo on the side" },
  ];
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const promises = fileArray.map(file => new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file as Blob);
        }));
        Promise.all(promises).then(base64s => setReferenceImages(prev => [...prev, ...base64s]));
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImprovePrompt = async () => {
    if (!prompt.trim()) return;
    setIsImproving(true);
    setPrompt(await improvePrompt(prompt, mode));
    setIsImproving(false);
  };

  const handleBrandingChip = (mockupPrompt: string) => {
      setPrompt(prev => prev ? `${prev}, ${mockupPrompt}` : mockupPrompt);
  };

  const handleGenerate = async (overridePrompt?: string, sourceImageBase64?: string, maskBase64?: string) => {
    let finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim()) return;
    
    const cost = modelTier === 'pro' ? 10 : 1;
    
    // Only CHECK credits - do NOT deduct yet!
    if (checkUsage && !checkUsage(modelTier, cost)) return;

    setIsGenerating(true);
    if(isEditing) setIsEditing(false); // Close editor if open
    if(viewImage) setViewImage(null); // Close viewer

    setError(null);
    
    if (mode === 'branding' && referenceImages.length === 0 && !sourceImageBase64) {
        setError(t('photo_alert_logo', language));
        setIsGenerating(false);
        return;
    }

    if (mode === 'logo' && !overridePrompt) {
        finalPrompt = `Vector logo design for "${finalPrompt}". Minimalist, clean lines, high contrast, professional brand identity icon, white background, flat vector graphics style.`;
    }

    let imagesPayload = referenceImages;
    if (sourceImageBase64) {
        imagesPayload = [sourceImageBase64];
        if (maskBase64) {
            imagesPayload.push(maskBase64);
            finalPrompt = `Edit the image. ${finalPrompt}. Use the second image as a mask for the area to change.`;
        }
    }

    const response = await generateImage(
        finalPrompt, 
        mode === 'logo' ? 'creative' : mode, 
        aspectRatio, 
        imagesPayload, 
        modelTier
    );
    
    if (response.imageUrl) {
      // SUCCESS! Now deduct credits
      if (deductCredits) {
        deductCredits(cost);
      }
      
      const newImage: SessionImage = {
          id: Date.now().toString(),
          url: response.imageUrl,
          aspectRatio: aspectRatio,
          tier: modelTier
      };
      setSessionImages(prev => [newImage, ...prev]);
      setViewImage(newImage);

      if (user?.id) {
        saveToHistory(user.id, {
          type: 'photo',
          imageUrl: response.imageUrl,
          prompt: finalPrompt,
          mode,
          aspectRatio
        });
      }
    } else {
      // ERROR - do NOT deduct credits, show error to user
      setError(response.error || "Ошибка генерации изображения. Кредиты не списаны.");
    }
    setIsGenerating(false);
  };

  const handleSendPhoto = async (image: SessionImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const file = new File([blob], `x5-image-${Date.now()}.jpg`, { type: "image/jpeg" });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: 'X5 Image' });
            return;
        } catch (shareError) {
            console.log("Share failed or cancelled, falling back to download");
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (e) { console.error(e); }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);

      ctx.lineTo(x, y);
      ctx.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
  };

  const handleApplyEdit = async () => {
      if (!viewImage) return;
      if (!editPrompt.trim()) {
          alert(t('photo_edit_placeholder', language));
          return;
      }

      let originalBase64 = '';
      try {
          const resp = await fetch(viewImage.url);
          const blob = await resp.blob();
          const reader = new FileReader();
          originalBase64 = await new Promise((resolve) => {
              reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
              reader.readAsDataURL(blob);
          });
      } catch (e) {
          console.error("Failed to load original image");
          return;
      }

      let maskBase64 = '';
      if (canvasRef.current) {
          const maskUrl = canvasRef.current.toDataURL('image/png');
          maskBase64 = maskUrl.split(',')[1];
      }

      handleGenerate(editPrompt, originalBase64, maskBase64);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          setTouchStartDist(dist);
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          const delta = dist - touchStartDist;
          const newZoom = Math.min(Math.max(zoomLevel + delta * 0.005, 1), 4);
          setZoomLevel(newZoom);
          setTouchStartDist(dist); 
      }
  };

  const currentModeInfo = modes.find(m => m.id === mode);

  return (
    <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto no-scrollbar">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100">
                <ChevronLeft className="text-slate-900" size={22} />
            </button>
            <div className="relative group">
                <button className="flex items-center gap-2">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 leading-none text-left">
                            {currentModeInfo?.label}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 text-left">X5 Vision</p>
                    </div>
                </button>
            </div>
        </div>
        <div className="glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-white/80 border-slate-200">
             <Zap size={14} className="text-yellow-500 fill-yellow-500" />
             <span className="text-xs font-extrabold text-slate-900">{user?.credits || 0}</span>
        </div>
      </div>

      <div className="space-y-4 pb-20">
            
            {/* TIER SELECTION */}
            <div className="glass-card p-1 rounded-[20px] flex items-center relative bg-white border border-slate-200 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 transition-opacity duration-500 pointer-events-none ${tierAnimating ? 'opacity-100' : 'opacity-0'}`} />
                
                <button onClick={() => handleTierSwitch('standard')} className={`flex-1 py-3 rounded-[16px] text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ${modelTier === 'standard' ? 'bg-slate-900 text-white shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-900'}`}>
                    <Zap size={14} className={modelTier === 'standard' ? 'fill-white' : ''}/> 
                    5X
                </button>
                
                <button onClick={() => handleTierSwitch('pro')} className={`flex-1 py-3 rounded-[16px] text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 relative ${modelTier === 'pro' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-900'}`}>
                    {user?.plan === 'free' ? (
                        <Lock size={14} className="text-slate-400" />
                    ) : (
                        <Cpu size={14} className={tierAnimating ? "animate-spin" : ""} /> 
                    )}
                    5X Pro
                </button>
            </div>
            
            {/* ASPECT RATIO ICONS */}
            {mode !== 'logo' && mode !== 'branding' && (
                <div className="glass-card p-2 rounded-[24px] flex items-center justify-between bg-white border border-slate-200 gap-1">
                {[
                  { id: '1:1', icon: Square }, { id: '3:4', icon: RectangleVertical }, 
                  { id: '9:16', icon: Smartphone }, { id: '16:9', icon: Monitor }, { id: '4:3', icon: RectangleHorizontal }
                ].map((r: any) => (
                    <button 
                    key={r.id} 
                    onClick={() => setAspectRatio(r.id)} 
                    className={`flex-1 h-12 rounded-[16px] flex items-center justify-center transition-all ${aspectRatio === r.id ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
                    >
                    <r.icon size={20} className={aspectRatio === r.id ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
                    </button>
                ))}
                </div>
            )}

            {/* BRANDING SPECIFIC UI */}
            {mode === 'branding' ? (
                <div className="space-y-4 animate-slide-up">
                    <div className="glass-card p-4 rounded-[28px] bg-white border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('photo_mode_logo', language)}</h3>
                            {referenceImages.length > 0 && <button onClick={() => setReferenceImages([])} className="text-[10px] text-red-400 font-bold uppercase">{t('photo_editor_clear', language)}</button>}
                        </div>
                        <div className="flex justify-center">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full h-32 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${referenceImages.length > 0 ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 bg-slate-50'}`}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                {referenceImages.length > 0 ? (
                                    <img src={`data:image/jpeg;base64,${referenceImages[0]}`} className="w-full h-full object-contain p-4" />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <Upload size={24} className="mx-auto mb-1" />
                                        <span className="text-[10px] font-bold">Upload</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4 rounded-[28px] bg-white border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('photo_input_brand_placeholder', language)}
                            className="w-full h-24 bg-slate-50 rounded-[20px] p-4 text-sm font-medium text-slate-900 border border-slate-200 focus:outline-none resize-none mb-4"
                        />
                        
                        <div className="grid grid-cols-3 gap-2">
                            {brandingMockups.map((m) => (
                                <button 
                                    key={m.id}
                                    onClick={() => handleBrandingChip(m.prompt)}
                                    className="flex flex-col items-center justify-center p-3 rounded-[16px] bg-slate-50 hover:bg-purple-50 border border-slate-100 transition-all active:scale-95 group"
                                >
                                    <m.icon size={18} className="text-slate-400 group-hover:text-purple-600 mb-1" />
                                    <span className="text-[9px] font-bold text-slate-600">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* STANDARD & LOGO PROMPT INPUT */
                <div className="glass-card p-4 rounded-[28px] shadow-lg border-white relative flex flex-col gap-4 bg-white/60">
                    <textarea 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        onFocus={handleInputFocus}
                        placeholder={mode === 'logo' ? t('photo_input_logo_placeholder', language) : t('photo_input_placeholder', language)} 
                        className="w-full h-24 bg-transparent text-[16px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none resize-none leading-relaxed" 
                    />
                    
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-slate-100">
                        <button onClick={() => fileInputRef.current?.click()} className="h-10 w-10 shrink-0 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-purple-600 hover:border-purple-300 transition-colors">
                            <ImagePlus size={18} />
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                        </button>
                        {referenceImages.map((img, idx) => (
                            <div key={idx} className="relative h-10 w-10 shrink-0">
                                <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover rounded-xl border border-slate-200" />
                                <button onClick={() => removeReferenceImage(idx)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"><X size={8}/></button>
                            </div>
                        ))}
                        <div className="flex-1"></div>
                        <button onClick={handleImprovePrompt} disabled={!prompt || isImproving} className={`h-10 flex items-center gap-1.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all border border-slate-200 ${isImproving ? 'bg-slate-100 text-slate-400' : 'bg-white text-purple-600 hover:bg-purple-50'}`}>{isImproving ? <RefreshCw className="animate-spin" size={12}/> : <Wand2 size={12} />}{isImproving ? '...' : 'AI'}</button>
                    </div>
                </div>
            )}

            {/* GENERATE BUTTON */}
            <button onClick={() => handleGenerate()} disabled={isGenerating || !prompt} className={`w-full py-5 rounded-[24px] shadow-lg flex items-center justify-center gap-2 text-[16px] font-bold transition-all border border-white/50 ${isGenerating || !prompt ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:opacity-90 active:scale-95'}`}>{isGenerating ? <><RefreshCw className="animate-spin" size={18} /><span>{t('photo_btn_creating', language)}</span></> : <><Sparkles size={18} /><span>{t('photo_btn_generate', language)}</span></>}</button>

            {/* RESULTS FEED */}
            <div className="space-y-8 mt-4">
                {isGenerating && (
                    <div className="animate-slide-up">
                        <div className={`w-full rounded-[24px] bg-slate-100 relative overflow-hidden flex items-center justify-center ${aspectRatio === '16:9' ? 'aspect-video' : (aspectRatio === '9:16' ? 'aspect-[9/16]' : (aspectRatio === '3:4' ? 'aspect-[3/4]' : (aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-square')))}`}>
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full animate-[shimmer_1.5s_infinite] transform -skew-x-12"></div>
                               <div className="z-10 flex flex-col items-center gap-3">
                                   <Sparkles className="text-purple-300 animate-pulse" size={32} />
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                                       AI Drawing...
                                   </p>
                               </div>
                        </div>
                    </div>
                )}

                {sessionImages.map((img) => (
                    <div key={img.id} className="animate-slide-up">
                        <div className="glass-panel p-2 rounded-[28px] shadow-2xl relative group border-white overflow-hidden">
                           <img 
                             src={img.url} 
                             onClick={() => setViewImage(img)} 
                             className={`w-full h-auto rounded-[24px] object-cover shadow-2xl cursor-pointer ${img.aspectRatio === '16:9' ? 'aspect-video' : (img.aspectRatio === '9:16' ? 'aspect-[9/16]' : (img.aspectRatio === '3:4' ? 'aspect-[3/4]' : (img.aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-square')))}`} 
                           />
                           
                           {isFreePlan && (
                               <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md pointer-events-none">
                                   <span className="text-[10px] font-bold text-white">X5 Free</span>
                               </div>
                           )}

                           {img.tier === 'pro' && (
                               <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-white uppercase tracking-widest shadow-sm">
                                   Pro
                               </div>
                           )}
                        </div>
                        <div className="flex gap-2 animate-fade-in mt-2">
                            <button onClick={() => setViewImage(img)} className="w-14 bg-white hover:bg-slate-50 text-slate-900 py-4 rounded-[20px] flex items-center justify-center gap-2 border border-slate-200 active:scale-95 transition-all shadow-sm"><Maximize2 size={18} /></button>
                            <button onClick={() => handleSendPhoto(img)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"><Send size={18} /> <span>{t('btn_download', language)}</span></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      
      {/* FULLSCREEN VIEWER & EDITOR */}
      {viewImage && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in">
           {/* Top Bar */}
           <div className="absolute top-0 w-full p-4 pt-12 flex justify-between items-center z-50 bg-white/80 backdrop-blur-md">
             <button onClick={() => { setViewImage(null); setIsEditing(false); setZoomLevel(1); }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X size={20} className="text-slate-600" /></button>
             <h3 className="font-bold text-slate-900">{isEditing ? t('photo_editor', language) : t('photo_viewer', language)}</h3>
             
             {isEditing ? (
                 <button onClick={handleApplyEdit} className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold shadow-lg">{t('photo_done', language)}</button>
             ) : (
                 <button onClick={() => setIsEditing(true)} className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg"><Edit3 size={18} /></button>
             )}
           </div>

           {/* Canvas Area */}
           <div className="flex-1 relative overflow-hidden bg-slate-50 flex items-center justify-center" 
                onTouchStart={!isEditing ? handleTouchStart : undefined} 
                onTouchMove={!isEditing ? handleTouchMove : undefined}
           >
              {/* Image Container with Zoom */}
              <div 
                className="relative transition-transform duration-100 ease-out" 
                style={{ 
                    transform: `scale(${zoomLevel})`, 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}
              >
                  <img src={viewImage.url} className="max-w-full max-h-full object-contain shadow-2xl" id="target-image" />
                  
                  {isFreePlan && (
                        <div className="absolute bottom-10 right-10 z-30 pointer-events-none opacity-50">
                            <span className="text-sm font-bold text-white bg-black/50 px-2 py-1 rounded">X5 Free Version</span>
                        </div>
                  )}
                  
                  {isEditing && (
                      <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 z-20 touch-none"
                        style={{
                            width: '100%', 
                            height: '100%',
                            maxWidth: document.getElementById('target-image')?.clientWidth,
                            maxHeight: document.getElementById('target-image')?.clientHeight
                        }}
                        width={1024} 
                        height={1024}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                  )}
              </div>
           </div>

           {/* Controls Bar */}
           <div className="p-6 pb-12 bg-white border-t border-slate-100 relative z-50">
               {isEditing ? (
                   <div className="space-y-4">
                       <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                           <span>{t('photo_editor_mask', language)}</span>
                           <button onClick={() => {
                               const canvas = canvasRef.current;
                               const ctx = canvas?.getContext('2d');
                               if (canvas && ctx) ctx.clearRect(0,0, canvas.width, canvas.height);
                           }} className="text-red-500 flex items-center gap-1"><Eraser size={12}/> {t('photo_editor_clear', language)}</button>
                       </div>
                       
                       <div className="flex gap-2">
                           <input 
                             value={editPrompt}
                             onChange={(e) => setEditPrompt(e.target.value)}
                             placeholder={t('photo_edit_placeholder', language)}
                             className="flex-1 bg-slate-50 border border-slate-200 rounded-[16px] px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-300 transition-colors"
                           />
                           <div className="w-12 h-12 bg-red-100 text-red-500 rounded-[16px] flex items-center justify-center">
                               <PenTool size={20} />
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="p-2 bg-slate-100 rounded-full text-slate-600"><ZoomOut size={18}/></button>
                            <span className="text-xs font-bold text-slate-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))} className="p-2 bg-slate-100 rounded-full text-slate-600"><ZoomIn size={18}/></button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => handleSendPhoto(viewImage)} className="flex-1 bg-slate-900 text-white py-4 rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                <Download size={20} /> <span>{t('btn_download', language)}</span>
                            </button>
                            <button onClick={() => {if(navigator.share) navigator.share({files:[], title:'Share', url: viewImage.url})}} className="w-16 bg-slate-100 text-slate-900 py-4 rounded-[24px] font-bold shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                                <Share2 size={20} />
                            </button>
                        </div>
                   </div>
               )}
           </div>
        </div>
      )}
    </div>
  );
};
