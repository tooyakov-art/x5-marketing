
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Copy, Check, FileText, ArrowRight, Wand2, ChevronLeft, FileType, Share2, Upload, History as HistoryIcon, Clock } from 'lucide-react';
import { LoadingSpinner } from '../components/GlassComponents';
import { generateSmartTemplate, adaptContractTemplate } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { ViewProps, HistoryItem } from '../types';
import { saveToHistory, subscribeToHistory } from '../services/historyService';
import { t } from '../services/translations';

// Extend window for html2pdf
declare global {
    interface Window {
        html2pdf: any;
    }
}

type Step = 'initial' | 'generating' | 'result';

export const ContractView: React.FC<ViewProps> = ({ user, onBack, initialPrompt, language = 'ru' }) => {
  const [step, setStep] = useState<Step>('initial');
  const [mode, setMode] = useState<'create' | 'template'>('create');
  
  // --- STATE ---
  const [description, setDescription] = useState(initialPrompt || '');
  const [result, setResult] = useState<string>('');

  // For Template Mode
  const [templateFileBase64, setTemplateFileBase64] = useState<string | null>(null);
  const [templateType, setTemplateType] = useState<'text' | 'image' | null>(null);
  const [adaptationPrompt, setAdaptationPrompt] = useState('');

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (user?.id) {
        const unsubscribe = subscribeToHistory(user.id, 'contract', (items) => {
            setHistory(items);
        });
        return () => unsubscribe();
    }
  }, [user?.id]);

  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix: Only auto-generate if initialPrompt is substantial
  useEffect(() => {
    if (initialPrompt && initialPrompt.length > 5 && step === 'initial') {
        handleGenerate(); 
    }
  }, [initialPrompt]);

  const handleInputFocus = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
  };

  const handleGenerate = async () => {
    // Mode 1: Create from scratch
    if (mode === 'create') {
        if (!description.trim()) return;
        
        setStep('generating');
        
        const minTime = new Promise(resolve => setTimeout(resolve, 1500));
        const genPromise = generateSmartTemplate(description);
        
        const [template] = await Promise.all([genPromise, minTime]);
        
        setResult(template);
        setStep('result');
        saveResult(template);
    } 
    // Mode 2: Adapt Template
    else if (mode === 'template') {
        if (!templateFileBase64 && !description.trim()) return; 
        if (!adaptationPrompt.trim()) {
            alert("Please specify adaptation details.");
            return;
        }
        
        setStep('generating');

        // If user pasted text into description instead of file
        const context = templateFileBase64 || description; 
        const isImg = templateType === 'image';

        const adapted = await adaptContractTemplate(context, adaptationPrompt, isImg);
        setResult(adapted);
        setStep('result');
        saveResult(adapted);
    }
  };

  const saveResult = (content: string) => {
      if (user?.id) {
        saveToHistory(user.id, {
            type: 'contract',
            prompt: mode === 'create' ? description : adaptationPrompt,
            content: content
        });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const res = reader.result as string;
          // Basic detection
          if (file.type.startsWith('image/')) {
              setTemplateType('image');
              setTemplateFileBase64(res.split(',')[1]); // Remove data:image/...;base64,
          } else if (file.type === 'text/plain') {
              setTemplateType('text');
              setTemplateFileBase64(res); 
          } else {
              setTemplateFileBase64(res.split(',')[1]); 
              setTemplateType('image'); 
          }
      };
      
      if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
      } else {
          reader.readAsText(file);
      }
  };

  const handleDownloadWord = () => {
      if (!result) return;

      // Simple HTML-to-Doc converter
      const htmlContent = result
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/# (.*?)\n/g, '<h1>$1</h1>') // H1
        .replace(/## (.*?)\n/g, '<h2>$1</h2>') // H2
        .replace(/\n/g, '<br/>'); // Newlines

      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Contract</title></head><body>";
      const footer = "</body></html>";
      const sourceHTML = header + htmlContent + footer;

      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = `contract_x5_${Date.now()}.doc`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
  };

  const handleRestore = (item: HistoryItem) => {
      if (item.content) {
          setResult(item.content);
          setStep('result');
          // Also restore prompt if available
          if (item.prompt) setDescription(item.prompt);
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in relative px-6 pt-16 pb-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100">
                <ChevronLeft className="text-slate-900" size={22} />
            </button>
            <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{t('contract_title', language)}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{t('contract_subtitle', language)}</p>
            </div>
          </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-32 scroll-smooth no-scrollbar z-10">
        
        {/* INPUT STEP */}
        {step === 'initial' && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-[20px] border border-slate-200">
                <button 
                  onClick={() => { setMode('create'); setTemplateFileBase64(null); }} 
                  className={`flex-1 py-3 rounded-[16px] text-xs font-bold transition-all ${mode === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                    {t('contract_mode_create', language)}
                </button>
                <button 
                  onClick={() => { setMode('template'); setDescription(''); }} 
                  className={`flex-1 py-3 rounded-[16px] text-xs font-bold transition-all ${mode === 'template' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                    {t('contract_mode_template', language)}
                </button>
            </div>

            {mode === 'create' ? (
                <div className="glass-card p-1 rounded-[32px] shadow-2xl shadow-blue-900/5 border border-slate-100 relative group bg-white/60">
                   <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     onFocus={handleInputFocus}
                     placeholder={t('contract_placeholder_create', language)}
                     className="w-full h-64 bg-transparent rounded-[30px] pt-6 pb-12 px-5 text-[17px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none resize-none transition-colors leading-relaxed"
                   />
                   <div className="absolute bottom-4 right-5 pointer-events-none">
                      <Wand2 className="text-purple-400 opacity-50" size={20} />
                   </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* File Upload Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full aspect-[2/1] rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${templateFileBase64 ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 bg-white/50'}`}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.txt" onChange={handleFileUpload} />
                        
                        {templateFileBase64 ? (
                            <div className="text-center">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Check size={24} />
                                </div>
                                <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Uploaded</span>
                                <p className="text-[10px] text-green-600 mt-1">{templateType === 'image' ? 'Image' : 'Text'}</p>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400">
                                <Upload size={32} className="mx-auto mb-2 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest block">Upload Template</span>
                                <span className="text-[10px]">Photo or text</span>
                            </div>
                        )}
                    </div>

                    {/* Adaptation Prompt */}
                    <div className="glass-card p-4 rounded-[24px] bg-white border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Details</label>
                        <textarea 
                            value={adaptationPrompt}
                            onChange={(e) => setAdaptationPrompt(e.target.value)}
                            onFocus={handleInputFocus}
                            placeholder={t('contract_placeholder_adapt', language)}
                            className="w-full h-32 bg-slate-50 rounded-[16px] p-4 text-sm font-medium text-slate-900 focus:outline-none resize-none"
                        />
                    </div>
                </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={mode === 'create' ? !description : (!templateFileBase64 && !description)}
              className={`w-full py-5 rounded-[26px] shadow-xl flex items-center justify-center gap-2 text-[17px] font-bold transition-all mt-4 border border-white/50 ${mode === 'create' ? (!description ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-purple-900/20') : ((!templateFileBase64 && !description) ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-purple-900/20')}`}
            >
              <span>{mode === 'create' ? t('contract_btn_create', language) : t('contract_btn_fill', language)}</span>
              <FileText size={20} className="text-white/60" />
            </button>
          </div>
        )}

        {/* LOADING STEP */}
        {step === 'generating' && (
           <div className="h-[60vh] flex flex-col items-center justify-center text-center">
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center shadow-xl border border-slate-100 relative z-10">
                   <LoadingSpinner />
                </div>
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">
                 AI Lawyer working...
             </h3>
             <p className="text-sm text-slate-500 max-w-[200px] animate-pulse">Drafting legal terms</p>
           </div>
        )}

        {/* RESULT STEP */}
        {step === 'result' && (
          <div className="animate-fade-in flex flex-col h-full items-center">
            
            {/* DOCUMENT PREVIEW */}
            <div className="w-full relative perspective-1000 mb-6">
                <div 
                  className="bg-white text-slate-900 p-[15mm] rounded-[2px] shadow-2xl shadow-slate-400/20 border border-slate-200 min-h-[400px] relative overflow-hidden font-serif transform transition-transform"
                >
                    {/* Watermark Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {/* Content */}
                    <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:uppercase prose-headings:tracking-widest prose-p:leading-relaxed prose-p:text-justify prose-li:my-1 text-[13px] sm:text-[15px]">
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* ACTION TOOLBAR */}
            <div className="w-full space-y-3">
               
               <div className="flex gap-3 animate-fade-in">
                   <button 
                     onClick={handleDownloadWord} 
                     className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-[24px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
                   >
                     <FileType size={20} />
                     <span>DOCX</span>
                   </button>
                   <button 
                     onClick={() => { if(navigator.share) navigator.share({ title: 'Contract', text: result }) }} 
                     className="w-16 bg-white text-slate-900 border border-slate-200 font-bold py-4 rounded-[24px] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                   >
                     <Share2 size={20} />
                   </button>
               </div>

               <div className="flex gap-3">
                   <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="flex-1 bg-white text-slate-600 font-bold py-3 rounded-[20px] flex items-center justify-center gap-2 shadow-sm border border-slate-100 active:scale-95 transition-transform text-sm">
                     {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                     <span>{copied ? 'Copied' : 'Copy Text'}</span>
                   </button>
                   
                   <button onClick={() => { setStep('initial'); setDescription(''); setTemplateFileBase64(null); setResult(''); }} className="w-14 bg-white text-slate-600 font-bold py-3 rounded-[20px] flex items-center justify-center shadow-sm border border-slate-100 active:scale-95 transition-transform">
                     <RefreshCw size={18} />
                   </button>
               </div>
            </div>
          </div>
        )}
        
        {/* HISTORY LIST (Scroll down to see) */}
        {history.length > 0 && (
            <div className="mt-12 mb-8 animate-slide-up">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <HistoryIcon size={16} className="text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">History</h3>
                </div>
                
                <div className="space-y-3">
                    {history.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleRestore(item)}
                            className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-start gap-3 active:scale-[0.98] transition-all cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                                <FileText size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight mb-1">
                                    {item.prompt || "Untitled"}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <Clock size={10} />
                                    <span>{item.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
