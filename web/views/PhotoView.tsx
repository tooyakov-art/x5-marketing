
import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, XCircle, Camera, Shirt, ShoppingBag, Zap, ImagePlus, ChevronLeft, History, ArrowRight, Wand2, Ratio, Maximize2, Share2, Heart, X } from 'lucide-react';
import { generateImage, improvePrompt } from '../services/geminiService';
import { LoadingSpinner } from '../components/GlassComponents';
import { PhotoMode, GeneratedImage } from '../types';

export const PhotoView: React.FC = () => {
  // Navigation State
  const [step, setStep] = useState<'menu' | 'generator'>('menu');
  const [mode, setMode] = useState<PhotoMode>('studio');

  // Generator State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Viewer State
  const [viewImage, setViewImage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const modes: {id: PhotoMode, label: string, desc: string, icon: any, color: string}[] = [
    { id: 'studio', label: 'Studio Pro', desc: 'Идеальный свет, чистый фон. Для каталогов.', icon: Camera, color: 'text-blue-500' },
    { id: 'lookbook', label: 'Lookbook', desc: 'Фэшн-съемка, лайфстайл, живые кадры.', icon: Shirt, color: 'text-pink-500' },
    { id: 'product', label: 'Product Macro', desc: 'Детальная съемка предметов крупным планом.', icon: ShoppingBag, color: 'text-emerald-500' },
    { id: 'cyber', label: 'Future / Neon', desc: 'Креатив, неон, киберпанк стиль.', icon: Zap, color: 'text-purple-500' },
  ];

  const handleModeSelect = (selectedMode: PhotoMode) => {
    setMode(selectedMode);
    setStep('generator');
    setResultImage(null);
    setPrompt('');
    setReferenceImage(null);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setReferenceImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleImprovePrompt = async () => {
    if (!prompt.trim()) return;
    setIsImproving(true);
    const improved = await improvePrompt(prompt, mode);
    setPrompt(improved);
    setIsImproving(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setResultImage(null);

    const response = await generateImage(
      prompt, 
      mode, 
      aspectRatio, 
      referenceImage ? [referenceImage] : []
    );
    
    if (response.imageUrl) {
      setResultImage(response.imageUrl);
      // Add to history
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: prompt,
        mode: mode,
        aspectRatio: aspectRatio,
        liked: false,
        date: new Date().toLocaleDateString('ru-RU')
      };
      setHistory(prev => [newImage, ...prev]);
    } else {
      setError(response.error || "Ошибка генерации");
    }
    setIsGenerating(false);
  };

  const handleShare = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'X5 Vision Image',
          text: 'Generated with X5 OS',
          url: url
        });
      } catch (e) {
        console.log('Share failed', e);
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Ссылка скопирована!');
    }
  };

  const currentModeInfo = modes.find(m => m.id === mode);

  // === IMAGE VIEWER MODAL ===
  if (viewImage) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-fade-in p-4">
        <button onClick={() => setViewImage(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
          <X size={24} />
        </button>
        <img src={viewImage} alt="Fullscreen" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
        <div className="mt-8 flex gap-6">
           <a href={viewImage} download="x5-image.png" className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100">
             <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Download size={20} /></div>
             <span className="text-[10px] uppercase font-bold">Скачать</span>
           </a>
           <button onClick={() => handleShare(viewImage)} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100">
             <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Share2 size={20} /></div>
             <span className="text-[10px] uppercase font-bold">Share</span>
           </button>
        </div>
      </div>
    );
  }

  // === SCREEN 1: DASHBOARD / MENU ===
  if (step === 'menu') {
    return (
      <div className="flex flex-col h-full animate-fade-in px-6 pt-4 pb-24 overflow-y-auto">
         <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            Фото-Лаборатория
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Выберите режим съемки
          </p>
        </div>

        {/* Mode Grid */}
        <div className="grid grid-cols-1 gap-4 mb-10">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeSelect(m.id)}
              className="glass-card p-5 rounded-[24px] flex items-center gap-4 text-left transition-transform active:scale-95 group hover:bg-white/60"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100`}>
                <m.icon size={26} className={m.color} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{m.label}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 opacity-80">{m.desc}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-slate-300 group-hover:text-slate-500">
                <ArrowRight size={16} />
              </div>
            </button>
          ))}
        </div>

        {/* Gallery / History Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 pl-2">
             <History size={16} className="text-slate-400" />
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">История генераций</h3>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-10 bg-white/30 rounded-[24px] border border-white/40 border-dashed">
              <p className="text-slate-400 text-sm font-medium">Галерея пуста</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {history.map((img) => (
                <div key={img.id} onClick={() => setViewImage(img.url)} className="glass-card p-2 rounded-[20px] animate-fade-in cursor-pointer active:scale-95 transition-transform">
                  <img src={img.url} alt="History" className={`w-full object-cover rounded-[16px] mb-2 bg-slate-100 ${img.aspectRatio === '16:9' ? 'aspect-video' : (img.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square')}`} />
                  <div className="px-1">
                     <p className="text-[10px] font-bold text-slate-900 truncate">{img.mode}</p>
                     <p className="text-[9px] text-slate-400 truncate">{img.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === SCREEN 2: GENERATOR ===
  return (
    <div className="flex flex-col h-full animate-slide-up px-6 pt-4 pb-24 overflow-y-auto">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('menu')} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft className="text-slate-600" size={22} />
        </button>
        <div>
           <h2 className="text-xl font-extrabold text-slate-900 leading-none">
             {currentModeInfo?.label}
           </h2>
           <p className="text-xs text-slate-500 font-medium mt-0.5">X5 Vision</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Aspect Ratio Selector */}
        <div className="glass-card p-1.5 rounded-[18px] flex items-center justify-between">
           {[
             { id: '1:1', label: '1:1', icon: Ratio },
             { id: '9:16', label: '9:16', icon: Ratio }, // Using Ratio icon as placeholder for orientation
             { id: '16:9', label: '16:9', icon: Ratio }
           ].map((r: any) => (
             <button
               key={r.id}
               onClick={() => setAspectRatio(r.id)}
               className={`flex-1 py-2 rounded-[14px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${aspectRatio === r.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
             >
               <span className={aspectRatio === r.id ? 'opacity-100' : 'opacity-50'}>{r.label}</span>
             </button>
           ))}
        </div>

        {/* Reference Image Upload */}
        <div className="glass-card p-4 rounded-[24px]">
           <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Референс (Опционально)</h3>
              {referenceImage && (
                <button onClick={() => setReferenceImage(null)} className="text-red-400 text-[10px] font-bold uppercase">Удалить</button>
              )}
           </div>
           
           <div 
             onClick={() => fileInputRef.current?.click()}
             className={`w-full h-24 rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${referenceImage ? 'border-transparent' : 'border-slate-300 hover:border-slate-400 bg-white/30'}`}
           >
             <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
             
             {referenceImage ? (
               <img src={`data:image/jpeg;base64,${referenceImage}`} className="w-full h-full object-cover" alt="Reference" />
             ) : (
               <>
                 <ImagePlus className="text-slate-400 mb-2" size={20} />
                 <span className="text-[10px] text-slate-500 font-medium">Загрузить фото</span>
               </>
             )}
           </div>
        </div>

        {/* Text Prompt */}
        <div className="glass-card p-2 rounded-[24px] shadow-lg border-purple-200/50 relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Опишите объект...`}
            className="w-full h-32 bg-white/50 rounded-[20px] p-4 pb-10 text-[15px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none resize-none backdrop-blur-sm"
          />
          
          {/* Magic Wand Button */}
          <div className="absolute bottom-3 left-3">
             <button 
               onClick={handleImprovePrompt}
               disabled={!prompt || isImproving}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all ${isImproving ? 'bg-purple-100 text-purple-400' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-purple-500/20 active:scale-95'}`}
             >
               {isImproving ? <RefreshCw className="animate-spin" size={12}/> : <Wand2 size={12} />}
               {isImproving ? 'Улучшаем...' : 'Улучшить (AI)'}
             </button>
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{prompt.length}/500</span>
          </div>
        </div>

        {/* Generate Button */}
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt}
          className={`w-full py-5 rounded-[22px] shadow-xl flex items-center justify-center gap-2 text-[17px] font-bold transition-all ${isGenerating || !prompt ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white shadow-slate-900/20 active:scale-95'}`}
        >
          {isGenerating ? (
             <>
               <RefreshCw className="animate-spin" size={20} />
               <span>Обработка...</span>
             </>
          ) : (
             <>
               <Sparkles size={20} className={prompt ? "text-yellow-300" : ""} />
               <span>Сгенерировать</span>
             </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-[20px] text-sm font-medium flex items-center gap-2 animate-fade-in">
            <XCircle size={18} />
            {error}
          </div>
        )}

        {/* Result Area */}
        {resultImage && (
          <div className="animate-slide-up space-y-4 pt-2">
             <div className="glass-panel p-2 rounded-[24px] shadow-2xl relative group">
               <img 
                 src={resultImage} 
                 alt="Generated" 
                 className={`w-full h-auto rounded-[20px] object-cover shadow-inner cursor-pointer ${aspectRatio === '16:9' ? 'aspect-video' : (aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square')}`}
                 onClick={() => setViewImage(resultImage)}
               />
               <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                 Нажмите для просмотра
               </div>
             </div>
             
             {/* ACTION TOOLBAR */}
             <div className="flex gap-2">
               <button 
                 onClick={() => setViewImage(resultImage)}
                 className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-[18px] flex items-center justify-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-transform"
               >
                 <Maximize2 size={18} />
               </button>
               
               <a 
                 href={resultImage} 
                 download={`x5-${currentModeInfo?.id}-${Date.now()}.png`}
                 className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-[18px] flex items-center justify-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-transform"
               >
                 <Download size={18} />
               </a>

               <button 
                 onClick={() => handleShare(resultImage)}
                 className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-[18px] flex items-center justify-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-transform"
               >
                 <Share2 size={18} />
               </button>

               <button 
                 className="flex-1 bg-slate-900 text-white py-3 rounded-[18px] flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
               >
                 <Heart size={18} className="text-red-400 fill-red-400" />
               </button>
             </div>
          </div>
        )}
        
        {isGenerating && (
           <div className="py-12">
             <LoadingSpinner />
           </div>
        )}
      </div>
    </div>
  );
};
