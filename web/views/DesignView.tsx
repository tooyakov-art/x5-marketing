
import React, { useState, useRef } from 'react';
import { PenTool, Check, Copy, ArrowRight, Zap, RefreshCw, Briefcase, Presentation, Layout, Monitor, ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from '../components/GlassComponents';
import { analyzeAndDraft, getInitialQuestions } from '../services/geminiService';
import { ContractFormData, QnAPair, DesignType } from '../types';
import ReactMarkdown from 'react-markdown';

type Step = 'selection' | 'initial' | 'analyzing' | 'questions' | 'result';

export const DesignView: React.FC = () => {
  const [step, setStep] = useState<Step>('selection');
  const [designType, setDesignType] = useState<DesignType | null>(null);
  
  const [description, setDescription] = useState('');
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({});
  const [qnaHistory, setQnaHistory] = useState<QnAPair[]>([]);
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelectType = (type: DesignType) => {
    setDesignType(type);
    setStep('initial');
    // Pre-fill placeholder based on type
    setDescription('');
  };

  const handleStart = async () => {
    if (!description.trim()) return;

    setStep('analyzing');
    const questions = await getInitialQuestions({ type: 'Design', date: '', description, designType: designType || 'creative' } as ContractFormData, 'design');
    setCurrentQuestions(questions);
    setStep('questions');
  };

  const handleSubmitAnswers = async () => {
    setStep('analyzing');
    const newHistoryPairs = currentQuestions.map((q, idx) => ({
      question: q,
      answer: currentAnswers[idx] || "Не указано"
    }));
    const updatedHistory = [...qnaHistory, ...newHistoryPairs];
    setQnaHistory(updatedHistory);

    const response = await analyzeAndDraft(
        { type: 'Design', date: '', description, designType: designType || 'creative' } as ContractFormData, 
        updatedHistory, 
        'design'
    );

    if (response.status === 'complete' && response.contract) {
      setResult(response.contract);
      setStep('result');
    } else if (response.questions) {
      setCurrentQuestions(response.questions);
      setCurrentAnswers({});
      setStep('questions');
    }
  };

  const categories = [
    { id: 'kp', title: 'КП', sub: 'Коммерческое предложение', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'presentation', title: 'Презентация', sub: 'Структура слайдов', icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'creative', title: 'Креатив', sub: 'Реклама / Reels / Shorts', icon: Zap, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'brand', title: 'Бренд', sub: 'Identity & Tone of Voice', icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'landing', title: 'Лендинг', sub: 'Структура сайта', icon: Monitor, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in relative">
      
      <div className="px-6 pt-4 pb-2 z-10 shrink-0">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
          {step === 'selection' ? 'Дизайн-Студия' : categories.find(c => c.id === designType)?.title || 'Проект'}
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {step === 'selection' ? 'Создание концепций, брифов и идей' : categories.find(c => c.id === designType)?.sub}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-24 scroll-smooth pt-4">
        
        {step === 'selection' && (
          <div className="animate-slide-up grid grid-cols-1 gap-4">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => handleSelectType(cat.id as DesignType)}
                className="glass-card p-5 rounded-[24px] flex items-center gap-4 text-left transition-transform active:scale-95 group hover:bg-white/60"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.bg} shadow-sm border border-white/50`}>
                  <cat.icon size={24} className={cat.color} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{cat.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1 opacity-70 uppercase tracking-wide">{cat.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-slate-300 group-hover:text-slate-500">
                  <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'initial' && (
          <div className="space-y-6 animate-slide-up">
            <button 
              onClick={() => setStep('selection')} 
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest pl-1"
            >
              <ChevronLeft size={14} /> Назад к выбору
            </button>

            <div className="glass-card p-1 rounded-[24px] shadow-lg border-slate-200/50">
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Опишите задачу для создания "${categories.find(c => c.id === designType)?.title}".\n\nПример: ${designType === 'kp' ? 'Продать услуги SMM строительной компании.' : 'Лендинг для онлайн-курса по йоге.'}`}
                    className="w-full h-48 bg-white/50 rounded-[20px] p-5 text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none resize-none backdrop-blur-sm"
                  />
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <PenTool size={10} className="text-white"/> X5 Pro
                    </div>
                  </div>
                </div>
              </div>

            <button 
              onClick={handleStart}
              disabled={!description}
              className={`w-full py-5 rounded-[22px] shadow-xl flex items-center justify-center gap-2 text-[17px] font-bold transition-all ${!description ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white shadow-slate-900/20 active:scale-95'}`}
            >
              <span>Сгенерировать</span>
              <ArrowRight size={20} className="text-white/60" />
            </button>
          </div>
        )}

        {step === 'analyzing' && (
           <div className="h-[60vh] flex flex-col items-center justify-center">
             <LoadingSpinner />
           </div>
        )}

        {step === 'questions' && (
          <div className="animate-slide-up space-y-6">
            <div className="glass-card p-5 rounded-[24px] border-l-4 border-purple-500">
              <h3 className="font-bold text-lg mb-1">Брифинг</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Уточните детали для создания качественного материала.
              </p>
            </div>

            {currentQuestions.map((q, idx) => (
              <div key={idx} className="space-y-3">
                <p className="font-bold text-slate-800 ml-2">{q}</p>
                <input
                  type="text"
                  className="w-full glass-input px-5 py-4 rounded-[20px] text-slate-900"
                  placeholder="Ответ..."
                  value={currentAnswers[idx] || ''}
                  onChange={(e) => setCurrentAnswers({...currentAnswers, [idx]: e.target.value})}
                />
              </div>
            ))}

            <button onClick={handleSubmitAnswers} className="w-full bg-purple-600 text-white font-bold py-5 rounded-[22px] shadow-xl shadow-purple-600/30 active:scale-95 transition-transform flex items-center justify-center gap-2">
               <span>Создать описание</span>
               <Zap size={20} className="fill-white"/>
            </button>
          </div>
        )}

        {step === 'result' && (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="glass-panel p-6 rounded-[24px] mb-4 text-sm text-slate-800 leading-relaxed shadow-lg overflow-y-auto flex-1 border border-white/60 bg-white/40">
                <div className="prose prose-sm max-w-none prose-headings:font-bold prose-p:my-2 prose-strong:text-slate-900">
                  <ReactMarkdown>
                    {result}
                  </ReactMarkdown>
                </div>
            </div>
            <div className="flex gap-3 mt-auto">
               <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                 {copied ? <Check size={20} /> : <Copy size={20} />}
                 <span>{copied ? 'Скопировано' : 'Копировать'}</span>
               </button>
               <button onClick={() => setStep('selection')} className="px-6 glass-card rounded-[20px] flex items-center justify-center">
                 <RefreshCw size={22} className="text-slate-700"/>
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
