
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Upload, Video, Play, Download, Sparkles, Loader2, ImagePlus, Zap, ArrowRight, Share2 } from 'lucide-react';
import { ViewProps } from '../types';
import { generateVideoFromImage, generateVideoInterpolation } from '../services/geminiService';
import { t } from '../services/translations';
import { useToast } from '../components/Toast';
import { useConfirmDialog } from '../components/ConfirmDialog';

export const VideoGenView: React.FC<ViewProps> = ({ onBack, user, checkUsage, deductCredits, language = 'ru' }) => {
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [step, setStep] = useState<'upload' | 'generating' | 'result'>('upload');
  const [mode, setMode] = useState<'simple' | 'interpolation'>('simple');
  
  // Image 1 (Start)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Image 2 (End)
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [endImageUrl, setEndImageUrl] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);

  const isFreePlan = user?.plan === 'free';

  // MEMORY LEAK FIX: Clean up video blob
  useEffect(() => {
      return () => {
          if (videoUrl) URL.revokeObjectURL(videoUrl);
      };
  }, [videoUrl]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEnd = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          if (isEnd) {
              setEndImageFile(file);
              setEndImageUrl(reader.result as string);
          } else {
              setImageFile(file);
              setImageUrl(reader.result as string);
          }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    if (mode === 'interpolation' && !endImageFile) return;

    const creditCost = 50;

    // Check credits first
    if ((user?.credits || 0) < creditCost) {
        showToast(language === 'ru' ? `Недостаточно кредитов! Нужно: ${creditCost}` : `Not enough credits! Need: ${creditCost}`, 'warning');
        return;
    }

    // Confirm credit cost
    const confirmed = await confirm({
        title: language === 'ru' ? 'Создать видео?' : 'Generate Video?',
        message: language === 'ru' ? 'Veo AI создаст видео из вашего изображения' : 'Veo AI will create a video from your image',
        type: 'credits',
        creditCost,
        userCredits: user?.credits || 0,
        confirmText: language === 'ru' ? 'Создать' : 'Generate',
        cancelText: language === 'ru' ? 'Отмена' : 'Cancel'
    });

    if (!confirmed) return;

    setStep('generating');
    setIsGenerating(true);

    try {
        // Read Start Image
        const reader1 = new FileReader();
        reader1.readAsDataURL(imageFile);

        reader1.onloadend = async () => {
             const startBase64 = (reader1.result as string).split(',')[1];

             // Clear previous video URL to free memory
             if (videoUrl) URL.revokeObjectURL(videoUrl);

             let result: string | null = null;

             if (mode === 'interpolation' && endImageFile) {
                 const reader2 = new FileReader();
                 reader2.readAsDataURL(endImageFile);
                 reader2.onloadend = async () => {
                     const endBase64 = (reader2.result as string).split(',')[1];
                     result = await generateVideoInterpolation(startBase64, endBase64, prompt);
                     processResult(result, creditCost);
                 };
             } else {
                 result = await generateVideoFromImage(startBase64, prompt);
                 processResult(result, creditCost);
             }
        };
    } catch (e) {
        setIsGenerating(false);
        setStep('upload');
        showToast(language === 'ru' ? 'Ошибка обработки' : 'Processing error', 'error');
    }
  };

  const processResult = (result: string | null, creditCost: number) => {
      if (result) {
          setVideoUrl(result);
          setStep('result');
          // Deduct credits after successful generation
          if (deductCredits) {
              deductCredits(creditCost);
          }
          showToast(language === 'ru' ? 'Видео создано!' : 'Video created!', 'success');
      } else {
          showToast(language === 'ru' ? 'Не удалось создать видео. Попробуйте другое фото.' : 'Failed to create video. Try another photo.', 'error');
          setStep('upload');
      }
      setIsGenerating(false);
  };

  const handleShareOrDownload = async () => {
      if (!videoUrl) return;
      
      try {
          // Fetch blob to share
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const file = new File([blob], "veo_generated.mp4", { type: 'video/mp4' });

          if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  files: [file],
                  title: 'Veo Animation',
                  text: 'Создано в X5 App'
              });
          } else {
              // Fallback to direct download
              const a = document.createElement('a');
              a.href = videoUrl;
              a.download = "x5_veo_video.mp4";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
          }
      } catch (e) {
          console.error("Share failed", e);
          // Fallback if share fails (e.g. cancelled)
          const a = document.createElement('a');
          a.href = videoUrl;
          a.download = "x5_veo_video.mp4";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in px-6 pt-16 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100"><ChevronLeft className="text-slate-900" size={22} /></button>
            <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{t('veo_title', language)}</h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{t('veo_subtitle', language)}</p>
            </div>
          </div>
          {/* Credit Balance */}
          <div className="glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-white/80 border-slate-200">
             <Zap size={14} className="text-yellow-500 fill-yellow-500" />
             <span className="text-xs font-extrabold text-slate-900">{user?.credits || 0}</span>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 scroll-smooth no-scrollbar">
          
          {step === 'upload' && (
              <div className="space-y-6 animate-slide-up">
                  
                  {/* Mode Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-[20px] border border-slate-200">
                      <button 
                        onClick={() => setMode('simple')} 
                        className={`flex-1 py-3 rounded-[16px] text-xs font-bold transition-all ${mode === 'simple' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                          {t('veo_mode_animate', language)}
                      </button>
                      <button 
                        onClick={() => setMode('interpolation')} 
                        className={`flex-1 py-3 rounded-[16px] text-xs font-bold transition-all ${mode === 'interpolation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                          {t('veo_mode_morph', language)}
                      </button>
                  </div>

                  <div className="glass-card p-6 rounded-[32px] bg-white/80 space-y-5">
                      {/* Start Image */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[16/9] rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors relative overflow-hidden group"
                      >
                          {imageUrl ? (
                              <img src={imageUrl} className="w-full h-full object-cover" />
                          ) : (
                              <>
                                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-2">
                                      <ImagePlus size={24} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start</span>
                              </>
                          )}
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                      </div>

                      {/* End Image (Interpolation Only) */}
                      {mode === 'interpolation' && (
                          <div className="relative">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center z-10 border border-white">
                                  <ArrowRight size={14} className="text-slate-500" />
                              </div>
                              <div 
                                onClick={() => endFileInputRef.current?.click()}
                                className="w-full aspect-[16/9] rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors relative overflow-hidden group"
                              >
                                  {endImageUrl ? (
                                      <img src={endImageUrl} className="w-full h-full object-cover" />
                                  ) : (
                                      <>
                                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-2">
                                              <ImagePlus size={24} />
                                          </div>
                                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">End</span>
                                      </>
                                  )}
                                  <input type="file" ref={endFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                              </div>
                          </div>
                      )}

                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Prompt
                          </label>
                          <textarea 
                             value={prompt} 
                             onChange={(e) => setPrompt(e.target.value)} 
                             className="w-full h-24 bg-slate-50 p-4 rounded-[20px] text-slate-900 font-medium border border-slate-200 mt-1 resize-none" 
                             placeholder={mode === 'interpolation' ? "Smooth cinematic transformation..." : "Cinematic zoom..."} 
                          />
                      </div>
                  </div>

                  <button onClick={handleGenerate} disabled={!imageFile || (mode === 'interpolation' && !endImageFile)} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Video size={20} /> <span>{t('veo_btn_gen', language)} (50 💎)</span>
                  </button>
              </div>
          )}

          {step === 'generating' && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                 <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                    <Loader2 className="animate-spin text-slate-900 relative z-10" size={48} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mt-6 mb-2">Veo Processing...</h3>
                 <p className="text-slate-500 font-medium text-sm animate-pulse">Wait 1-2 mins</p>
              </div>
          )}

          {step === 'result' && videoUrl && (
              <div className="animate-slide-up space-y-6">
                  <div className="glass-card p-2 rounded-[32px] bg-black shadow-2xl overflow-hidden aspect-[9/16] relative">
                      <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover rounded-[28px]" />
                      
                      {/* Watermark for Free Plan */}
                      {isFreePlan && (
                          <div className="absolute bottom-16 right-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md pointer-events-none opacity-80">
                              <span className="text-[10px] font-bold text-white">X5 Free Version</span>
                          </div>
                      )}
                  </div>
                  
                  <button onClick={handleShareOrDownload} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Share2 size={20} /> <span>{t('btn_download', language)}</span>
                  </button>

                  <button onClick={() => { setStep('upload'); if(videoUrl) URL.revokeObjectURL(videoUrl); setVideoUrl(null); }} className="w-full py-5 bg-white border border-slate-200 text-slate-900 rounded-[24px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Sparkles size={20} /> <span>{t('btn_generate', language)}</span>
                  </button>
              </div>
          )}

      </div>
    </div>
  );
};
