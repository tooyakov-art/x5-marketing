
import React, { useRef, useState } from 'react';
import { ChevronLeft, FileVideo, Sparkles, History, Lock, Layers } from 'lucide-react';
import { LoadingSpinner } from '../../components/GlassComponents';
import { User } from '../../types';
import { t } from '../../services/translations';

interface VideoSetupProps {
    mediaUrl: string | null;
    prompt: string;
    setPrompt: (v: string) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onGenerate: (quantity: number) => void;
    isGenerating: boolean;
    onBack: () => void;
    onRestoreHistory?: () => void;
    user?: User | null;
    language?: string; // Passed from parent
}

export const VideoSetup: React.FC<VideoSetupProps> = ({ mediaUrl, prompt, setPrompt, onUpload, onGenerate, isGenerating, onBack, onRestoreHistory, user, language = 'ru' }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [quantity, setQuantity] = useState<number>(2);

    const handleInputFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    const isPro = user?.plan !== 'free';

    const handleQuantitySelect = (q: number) => {
        if (!isPro && q > 2) return; // Prevent selection for free users
        setQuantity(q);
    };

    return (
        <div className="flex flex-col h-full bg-[#f2f4f6] relative overflow-hidden animate-fade-in">
             {/* Header */}
            <div className="pt-12 px-6 pb-2 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                        <ChevronLeft size={22} className="text-slate-800" />
                    </button>
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 leading-none">{t('video_setup_title', language)}</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{t('video_setup_subtitle', language)}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-48">
                 {/* Upload Card */}
                 <div 
                    onClick={() => !isGenerating && fileInputRef.current?.click()}
                    className={`relative w-full aspect-[9/16] max-h-[40vh] rounded-[32px] overflow-hidden border-2 transition-all flex flex-col items-center justify-center group mb-6 ${mediaUrl ? 'border-transparent shadow-2xl' : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-purple-300 cursor-pointer'}`}
                >
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={onUpload} disabled={isGenerating} />
                    
                    {mediaUrl ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" muted loop playsInline autoPlay />
                    ) : (
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 text-purple-600">
                                <FileVideo size={28} />
                            </div>
                            <p className="text-slate-900 font-bold">{t('video_upload', language)}</p>
                            <p className="text-xs text-slate-400 mt-1">{t('video_upload_desc', language)}</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="animate-slide-up space-y-5">
                    
                    {/* Prompt */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-2 block">{t('video_prompt_label', language)}</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onFocus={handleInputFocus}
                            placeholder={t('video_prompt_placeholder', language)}
                            className="w-full h-24 bg-white rounded-[24px] p-5 text-slate-900 font-medium text-sm focus:outline-none resize-none shadow-sm border border-slate-100"
                        />
                    </div>

                    {/* Quantity Selection */}
                    <div>
                        <div className="flex justify-between items-center ml-2 mb-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('video_variants', language)}</label>
                            {!isPro && <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Pro Unlock 4-8</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[2, 4, 8].map((q) => {
                                const isLocked = !isPro && q > 2;
                                return (
                                    <button
                                        key={q}
                                        onClick={() => handleQuantitySelect(q)}
                                        className={`py-3 rounded-[18px] font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all border ${
                                            quantity === q 
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]' 
                                            : (isLocked ? 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed opacity-70' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')
                                        }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <Layers size={14} />
                                            <span>{q}</span>
                                        </div>
                                        {isLocked && <Lock size={10} className="text-slate-400" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <button 
                        onClick={() => onGenerate(quantity)}
                        disabled={!mediaUrl || !prompt.trim() || isGenerating}
                        className={`w-full py-5 rounded-[24px] font-bold text-lg shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform ${!mediaUrl || !prompt.trim() ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white shadow-purple-900/20'}`}
                    >
                        {isGenerating ? <LoadingSpinner /> : <><Sparkles size={20} className="text-yellow-400 fill-yellow-400" /><span>{t('btn_generate', language)}</span></>}
                    </button>

                    {/* History Button - Only shows if not generating */}
                    {!isGenerating && onRestoreHistory && (
                        <button 
                            onClick={onRestoreHistory}
                            className="w-full py-4 rounded-[24px] font-bold text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <History size={16} />
                            <span>{t('profile_history', language)}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
