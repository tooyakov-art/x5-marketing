
import React, { useState, useRef } from 'react';
import { RefreshCw, Copy, Check, FileText, ArrowRight, Wand2, Briefcase, Globe, PenTool, Home, FileDown } from 'lucide-react';
import { LoadingSpinner } from '../components/GlassComponents';
import { generateSmartTemplate } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

type Step = 'initial' | 'generating' | 'result';

export const ContractView: React.FC = () => {
  const [step, setStep] = useState<Step>('initial');
  
  // Minimal State - Just the description
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickOptions = [
    { label: "Сайт на Тильде", icon: Globe, text: "Разработка сайта на Tilda под ключ. Оплата 50/50. Срок 14 дней." },
    { label: "SMM / Ведение", icon: PenTool, text: "Ведение Инстаграм аккаунта. 15 сторис, 3 рилс в неделю. Оплата ежемесячно." },
    { label: "Дизайн проект", icon: Briefcase, text: "Дизайн интерьера квартиры 50кв.м. Включая 3 правки. Авторский надзор." },
    { label: "Аренда", icon: Home, text: "Сдача квартиры в аренду на длительный срок. Депозит 1 месяц." },
  ];

  const handleQuickOption = (text: string) => {
    setDescription(text);
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setStep('generating');
    const template = await generateSmartTemplate(description);
    setResult(template);
    setStep('result');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in relative">
      
      {/* Header */}
      <div className="px-6 pt-4 pb-2 z-10 shrink-0">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
          Договор
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {step === 'initial' ? 'Опишите задачу простыми словами' : 'Ваш готовый шаблон'}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-24 scroll-smooth pt-4">
        
        {/* === STEP 1: MAGIC INPUT === */}
        {step === 'initial' && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Main Input Area */}
            <div className="glass-card p-2 rounded-[28px] shadow-xl shadow-blue-900/5 border border-white/60 relative group">
               <textarea 
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Например: Делаю монтаж видео для YouTube, оплата за каждый ролик 5000р..."
                 className="w-full h-40 bg-white/40 rounded-[22px] p-5 text-[17px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none resize-none backdrop-blur-sm focus:bg-white/60 transition-colors"
               />
               <div className="absolute bottom-4 right-4">
                  <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Wand2 size={12} className="text-yellow-400" />
                    <span>AI Pro</span>
                  </div>
               </div>
            </div>

            {/* Quick Chips */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4 mb-3">Быстрый старт</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickOptions.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleQuickOption(opt.text)}
                    className="glass-card p-4 rounded-[20px] flex flex-col items-center justify-center gap-2 text-center active:scale-95 transition-all hover:bg-white/60"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
                      <opt.icon size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleGenerate}
              disabled={!description}
              className={`w-full py-5 rounded-[24px] shadow-2xl flex items-center justify-center gap-2 text-[17px] font-bold transition-all mt-4 ${!description ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white shadow-blue-900/20 active:scale-95'}`}
            >
              <span>Создать Шаблон</span>
              <ArrowRight size={20} className="text-white/60" />
            </button>
            
            <p className="text-center text-[11px] text-slate-400 px-8 leading-relaxed">
              ИИ сам подберет юридические формулировки, этапы оплаты и условия расторжения для вашей ниши.
            </p>
          </div>
        )}

        {/* === STEP: GENERATING === */}
        {step === 'generating' && (
           <div className="h-[60vh] flex flex-col items-center justify-center text-center">
             <LoadingSpinner />
             <p className="text-slate-500 font-medium text-sm mt-4 max-w-[200px] animate-pulse">
               Подбираем юридические формулировки для вашей ниши...
             </p>
           </div>
        )}

        {/* === STEP: RESULT === */}
        {step === 'result' && (
          <div className="animate-fade-in flex flex-col h-full">
            
            <div className="bg-white p-8 rounded-[24px] mb-4 text-sm text-slate-900 leading-relaxed shadow-xl overflow-y-auto flex-1 border border-slate-100 font-serif">
                {/* This simulates a paper document view */}
                <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:my-3 prose-strong:text-black prose-ul:list-disc prose-li:my-1">
                  <ReactMarkdown>
                    {result}
                  </ReactMarkdown>
                </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
               <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="w-full bg-slate-900 text-white font-bold py-4 rounded-[22px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                 {copied ? <Check size={20} /> : <Copy size={20} />}
                 <span>{copied ? 'Текст скопирован' : 'Скопировать текст'}</span>
               </button>
               
               <div className="flex gap-3">
                 <button className="flex-1 glass-card py-4 rounded-[22px] flex items-center justify-center gap-2 font-bold text-slate-700 active:scale-95 transition-transform">
                    <FileDown size={20} />
                    <span>PDF</span>
                 </button>
                 <button onClick={() => { setStep('initial'); setDescription(''); }} className="flex-1 glass-card py-4 rounded-[22px] flex items-center justify-center gap-2 font-bold text-slate-700 active:scale-95 transition-transform">
                    <RefreshCw size={20} />
                    <span>Новый</span>
                 </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
