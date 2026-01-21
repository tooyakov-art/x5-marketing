
import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Check, Copy, ArrowRight, Zap, RefreshCw, Briefcase, ChevronLeft, Upload, Image as ImageIcon, Download, Edit3, Trash2, Plus, Layout, Type, Lock, FileText, ListOrdered, Share2, Grid, Clock, AlignLeft, Flag } from 'lucide-react';
import { LoadingSpinner } from '../components/GlassComponents';
import { generateKPPlan, generateFullKPFromPlan, getInitialQuestions, analyzeAndDraft } from '../services/geminiService';
import { ContractFormData, QnAPair, DesignType, ViewProps, KPPage, KPPresentation, KPPlanItem } from '../types';
import { saveToHistory } from '../services/historyService';
import ReactMarkdown from 'react-markdown';
import { t } from '../services/translations';

declare global {
    interface Window {
        html2pdf: any;
    }
}

export const DesignView: React.FC<ViewProps> = ({ user, onBack, initialPrompt, language = 'ru', checkUsage }) => {
  // Navigation Steps
  const [step, setStep] = useState<'selection' | 'kp_setup' | 'kp_plan' | 'kp_editor' | 'initial' | 'analyzing' | 'questions' | 'result'>('selection');
  
  // KP State
  const [kpInputs, setKpInputs] = useState({ company: '', description: '', pageCount: 5 });

  const [kpPlan, setKpPlan] = useState<KPPlanItem[]>([]);
  const [kpData, setKpData] = useState<KPPresentation | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingFull, setIsGeneratingFull] = useState(false);
  
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  
  // Generic State
  const [designType, setDesignType] = useState<DesignType | null>(null);
  
  // Generic Inputs
  const [description, setDescription] = useState(initialPrompt && !initialPrompt.startsWith('{') ? initialPrompt : '');

  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({});
  const [qnaHistory, setQnaHistory] = useState<QnAPair[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputFocus = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
  };

  useEffect(() => {
    if (initialPrompt) {
        try {
            if (initialPrompt.startsWith('{')) {
                const parsed = JSON.parse(initialPrompt);
                if (parsed.meta && parsed.pages) {
                    setDesignType('kp');
                    setKpData(parsed);
                    if (parsed.pages.length > 0) setActivePageId(parsed.pages[0].id);
                    setStep('kp_editor');
                    return;
                }
            }
        } catch (e) {}
        setStep('initial');
        setDescription(initialPrompt);
    }
  }, [initialPrompt]);

  // --- KP LOGIC ---
  const handleStartKP = () => {
      setDesignType('kp');
      setStep('kp_setup');
      setKpInputs({ company: '', description: '', pageCount: 5 });
      setLogoBase64(null);
  };

  const handleGeneratePlan = async () => {
      if (!kpInputs.company || !kpInputs.description) return;
      setIsGeneratingPlan(true);
      
      const plan = await generateKPPlan(
          kpInputs.company,
          kpInputs.description,
          kpInputs.pageCount,
          language
      );
      
      setKpPlan(plan);
      setStep('kp_plan');
      setIsGeneratingPlan(false);
  };

  const handleUpdatePlanTitle = (id: string, newTitle: string) => {
      setKpPlan(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
  };

  const handleGenerateFullKP = async () => {
      if (checkUsage && !checkUsage('pro', 20)) return;

      setIsGeneratingFull(true);
      const presentation = await generateFullKPFromPlan(
          kpInputs.company,
          kpPlan,
          language
      );

      if (presentation) {
          setKpData(presentation);
          if (presentation.pages.length > 0) {
              setActivePageId(presentation.pages[0].id);
          }
          setStep('kp_editor');
          if (user?.id) {
              saveToHistory(user.id, {
                  type: 'design',
                  designType: 'kp',
                  prompt: `KP: ${kpInputs.company}`,
                  content: JSON.stringify(presentation)
              });
          }
      }
      setIsGeneratingFull(false);
  };

  const handleUpdatePage = (id: string, field: keyof KPPage, value: string) => {
      if (!kpData) return;
      const newPages = kpData.pages.map(p => p.id === id ? { ...p, [field]: value } : p);
      setKpData({ ...kpData, pages: newPages });
  };

  const getPdfOptions = () => ({
      margin: 0,
      filename: `KP_${kpInputs.company.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });

  const handleDownloadPDF = () => {
      const element = document.getElementById('kp-container');
      if (element && window.html2pdf) {
          window.html2pdf().from(element).set(getPdfOptions()).save();
      } else {
          alert('PDF engine loading...');
      }
  };

  const handleSharePDF = async () => {
      const element = document.getElementById('kp-container');
      if (element && window.html2pdf) {
          try {
              const worker = window.html2pdf().from(element).set(getPdfOptions());
              const pdfBlob = await worker.output('blob');
              const file = new File([pdfBlob], `KP_${kpInputs.company}.pdf`, { type: 'application/pdf' });

              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  await navigator.share({
                      files: [file],
                      title: 'Commercial Proposal',
                      text: `Created in X5.`
                  });
              } else {
                  worker.save();
              }
          } catch (e) {
              alert("Error creating PDF.");
          }
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (user?.plan === 'free') {
          alert('Custom Logo available in Pro version');
          return;
      }
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setLogoBase64((reader.result as string).split(',')[1]);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- GENERIC LOGIC ---
  const handleSelectGeneric = (type: DesignType) => {
      setDesignType(type);
      setStep('initial');
      setDescription('');
  };

  const handleStartGeneric = async () => {
      if (!description.trim()) return;
      setStep('analyzing');
      const questions = await getInitialQuestions({ type: 'Design', date: '', description, designType: designType || 'creative' } as ContractFormData, 'design');
      setCurrentQuestions(questions);
      setStep('questions');
  };

  const handleSubmitAnswers = async () => {
      if (checkUsage && !checkUsage('pro', 20)) return;

      setStep('analyzing');
      const newHistory = [...qnaHistory, ...currentQuestions.map((q, idx) => ({ question: q, answer: currentAnswers[idx] || "Not specified" }))];
      setQnaHistory(newHistory);
      const formData: ContractFormData = { type: 'Design', date: '', description, designType: designType || 'creative', logoBase64: logoBase64 || undefined };
      const response = await analyzeAndDraft(formData, newHistory, 'design');
      if (response.status === 'complete' && response.contract) { setResult(response.contract); setStep('result'); }
  };

  // --- LIGHT THEME PDF RENDERER ---
  const renderStylishA4 = (page: KPPage, index: number, totalPages: number) => {
     if (!kpData) return null;
     
     const layout = page.layout || (index === 0 ? 'cover' : (index === totalPages - 1 ? 'contacts' : 'section_text'));

     const containerStyle: React.CSSProperties = {
        width: '210mm', 
        height: '297mm', 
        fontFamily: '"SF Pro Display", "Helvetica Neue", Arial, sans-serif',
        pageBreakAfter: 'always',
        backgroundColor: '#ffffff',
        color: '#1a202c',
        position: 'relative',
        overflow: 'hidden'
     };

     const Header = () => (
        <div className="absolute top-[15mm] left-[20mm] right-[20mm] flex justify-between items-center border-b border-slate-100 pb-4">
             <div className="flex items-center gap-3">
                 {logoBase64 ? (
                     <img src={`data:image/png;base64,${logoBase64}`} className="h-8 object-contain" alt="Logo" />
                 ) : (
                     <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">X5</div>
                 )}
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpInputs.company}</span>
             </div>
             <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                 Page {index + 1}
             </div>
        </div>
     );

     switch(layout) {
        case 'cover':
            return (
                <div id={`page-${page.id}`} key={page.id} style={containerStyle} className="flex flex-col">
                    <div className="flex-1 flex flex-col justify-center p-[20mm] relative">
                         <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-slate-50 skew-x-12 origin-top-right -z-10"></div>
                         <div className="mb-auto pt-10">
                            {logoBase64 ? (
                                <img src={`data:image/png;base64,${logoBase64}`} className="h-20 object-contain mb-6" />
                            ) : (
                                <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">X5</div>
                            )}
                            <div className="h-1 w-20 bg-blue-600 mb-6"></div>
                         </div>
                         <div className="mb-20">
                             <h1 className="text-6xl font-black text-slate-900 leading-[1.0] tracking-tighter uppercase mb-6">{page.title}</h1>
                             <p className="text-2xl font-light text-slate-500 leading-relaxed max-w-lg">{page.content || kpInputs.description}</p>
                         </div>
                         <div className="mt-auto">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Prepared For</p>
                            <p className="text-lg font-bold text-slate-900">Clients & Partners</p>
                            <p className="text-sm text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
                         </div>
                    </div>
                </div>
            );

        case 'timeline': 
             return (
                 <div id={`page-${page.id}`} key={page.id} style={containerStyle} className="p-[20mm] pt-[40mm]">
                     <Header />
                     <h2 className="text-4xl font-extrabold text-slate-900 mb-4">{page.title}</h2>
                     <p className="text-slate-500 mb-12 max-w-2xl text-sm">{page.content}</p>
                     
                     <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 py-2">
                         {page.items && page.items.length > 0 ? page.items.map((item, i) => (
                             <div key={i} className="relative pl-12">
                                 <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">{i+1}</div>
                                 <h3 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h3>
                                 <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                             </div>
                         )) : (
                             <div className="pl-12 text-slate-400 italic">No timeline items generated...</div>
                         )}
                     </div>
                 </div>
             );

        case 'grid': 
             return (
                 <div id={`page-${page.id}`} key={page.id} style={containerStyle} className="p-[20mm] pt-[40mm]">
                     <Header />
                     <h2 className="text-4xl font-extrabold text-slate-900 mb-6">{page.title}</h2>
                     <p className="text-lg text-slate-500 mb-12 max-w-2xl">{page.content}</p>
                     
                     <div className="grid grid-cols-2 gap-6">
                        {page.items && page.items.length > 0 ? page.items.map((item, i) => (
                             <div key={i} className="bg-slate-50 p-6 rounded-[16px] border border-slate-100 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/50 rounded-bl-[32px] -mr-4 -mt-4"></div>
                                 <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">{item.title}</h3>
                                 <p className="text-sm text-slate-600 leading-relaxed relative z-10">{item.desc}</p>
                             </div>
                        )) : (
                             <div className="col-span-2 text-slate-400 italic">Items generation pending...</div>
                        )}
                     </div>
                 </div>
             );

        default:
            return (
                <div id={`page-${page.id}`} key={page.id} style={containerStyle} className="p-[20mm] pt-[40mm] flex flex-col">
                    <Header />
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-8 uppercase tracking-tight">{page.title}</h2>
                    <div className="flex-1 text-slate-700 font-medium text-[11pt] leading-[1.6]">
                        <div className="prose max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-ul:list-disc prose-li:mb-2 text-justify">
                             <ReactMarkdown>{page.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            );
     }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in relative px-6 pt-16 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100"><ChevronLeft className="text-slate-900" size={22} /></button>
            <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {step === 'selection' ? t('design_title', language) : (designType === 'kp' ? t('design_kp', language) : 'Project')}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{step === 'selection' ? t('design_subtitle', language) : 'X5 Vision'}</p>
            </div>
          </div>
          <div className="glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-white/80 border-slate-200">
             <Zap size={14} className="text-yellow-500 fill-yellow-500" />
             <span className="text-xs font-extrabold text-slate-900">{user?.credits || 0}</span>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-48 scroll-smooth no-scrollbar">
        
        {/* STEP 0: SELECTION */}
        {step === 'selection' && (
           <div className="grid grid-cols-1 gap-4">
              <button onClick={handleStartKP} className="glass-card p-6 rounded-[28px] flex items-center gap-4 text-left hover:bg-white active:scale-[0.98] transition-all group border-l-4 border-emerald-500">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600"><Briefcase size={28}/></div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900">{t('design_kp', language)}</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-bold">{t('design_kp_desc', language)}</p>
                  </div>
              </button>
              
              <button onClick={() => handleSelectGeneric('brand')} className="glass-card p-6 rounded-[28px] flex items-center gap-4 text-left hover:bg-white active:scale-[0.98] transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600"><Zap size={28}/></div>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900">{t('design_brand', language)}</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-bold">{t('design_brand_desc', language)}</p>
                  </div>
              </button>
           </div>
        )}

        {/* STEP 1: KP SETUP */}
        {step === 'kp_setup' && (
           <div className="space-y-6 animate-slide-up">
              <div className="glass-card p-6 rounded-[32px] bg-white/80 space-y-4">
                  <div className="flex flex-col items-center mb-4">
                      <div 
                        onClick={() => { if(user?.plan !== 'free') fileInputRef.current?.click(); }} 
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors relative overflow-hidden border ${user?.plan === 'free' ? 'bg-slate-50 cursor-not-allowed border-slate-200' : 'bg-slate-100 cursor-pointer hover:bg-slate-200 border-dashed border-slate-300'}`}
                      >
                          {logoBase64 ? (
                             <img src={`data:image/png;base64,${logoBase64}`} className="w-full h-full object-contain p-2" />
                          ) : (
                             user?.plan === 'free' ? <span className="text-2xl font-black text-slate-300">X5</span> : <Upload className="text-slate-400" />
                          )}
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                         <p className="text-[10px] text-slate-400 font-bold uppercase">Logo</p>
                         {user?.plan === 'free' && <Lock size={10} className="text-slate-400" />}
                      </div>
                  </div>
                  
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company</label>
                      <input onFocus={handleInputFocus} value={kpInputs.company} onChange={(e) => setKpInputs({...kpInputs, company: e.target.value})} className="w-full bg-slate-50 p-4 rounded-[16px] text-slate-900 font-bold border border-slate-200 mt-1" />
                  </div>

                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pages</label>
                      <div className="flex gap-2 mt-1">
                          {[3, 5, 7, 10].map(n => (
                              <button 
                                key={n} 
                                onClick={() => setKpInputs({...kpInputs, pageCount: n})}
                                className={`flex-1 py-3 rounded-[14px] text-xs font-bold border transition-all ${kpInputs.pageCount === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                  {n}
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('design_input_placeholder', language)}</label>
                      <textarea onFocus={handleInputFocus} value={kpInputs.description} onChange={(e) => setKpInputs({...kpInputs, description: e.target.value})} className="w-full h-32 bg-slate-50 p-4 rounded-[16px] text-slate-900 font-medium border border-slate-200 mt-1 resize-none" />
                  </div>
              </div>
              <button onClick={handleGeneratePlan} disabled={isGeneratingPlan || !kpInputs.description} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  {isGeneratingPlan ? <LoadingSpinner /> : <><ListOrdered size={20} /> <span>{t('design_btn_plan', language)}</span></>}
              </button>
           </div>
        )}

        {/* STEP 1.5: PLAN REVIEW */}
        {step === 'kp_plan' && (
           <div className="space-y-6 animate-slide-up">
               <div className="glass-card p-5 rounded-[24px] bg-white/90">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ListOrdered className="text-emerald-500" /> Plan Review</h3>
                  <div className="space-y-3">
                      {kpPlan.map((page, idx) => (
                          <div key={page.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{idx + 1}</span>
                             <input 
                                value={page.title} 
                                onChange={(e) => handleUpdatePlanTitle(page.id, e.target.value)}
                                className="flex-1 bg-transparent font-bold text-slate-900 text-sm focus:outline-none"
                             />
                          </div>
                      ))}
                  </div>
               </div>
               
               <button onClick={handleGenerateFullKP} disabled={isGeneratingFull} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                   {isGeneratingFull ? <LoadingSpinner /> : <><Layout size={20} /> <span>{t('design_btn_full', language)}</span></>}
               </button>
           </div>
        )}

        {/* STEP 2: KP EDITOR */}
        {step === 'kp_editor' && kpData && (
           <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {kpData.pages.map((p, i) => {
                      let Icon = AlignLeft;
                      if (p.layout === 'timeline') Icon = Clock;
                      if (p.layout === 'grid') Icon = Grid;
                      if (p.layout === 'cover') Icon = Flag;
                      
                      return (
                        <button 
                            key={p.id} 
                            onClick={() => setActivePageId(p.id)} 
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activePageId === p.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                        >
                            <Icon size={12} />
                            {i + 1}. {p.title.slice(0, 10)}..
                        </button>
                      );
                  })}
              </div>

              {/* Edit Area */}
              <div className="flex-1 bg-white rounded-[24px] p-4 mb-4 overflow-y-auto border border-slate-200 shadow-sm">
                 {kpData.pages.map(p => {
                     if (p.id !== activePageId) return null;
                     return (
                         <div key={p.id} className="space-y-4 animate-fade-in">
                             <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layout Type: {p.layout}</span>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
                                 <input value={p.title} onChange={(e) => handleUpdatePage(p.id, 'title', e.target.value)} onFocus={handleInputFocus} className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900" />
                             </div>
                             
                             {p.layout === 'timeline' || p.layout === 'grid' ? (
                                 <div>
                                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Items (Generated by AI)</label>
                                     <div className="space-y-2">
                                         {p.items?.map((item, idx) => (
                                             <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                 <div className="font-bold text-sm text-slate-900">{item.title}</div>
                                                 <div className="text-xs text-slate-500">{item.desc}</div>
                                             </div>
                                         ))}
                                     </div>
                                     <p className="text-[10px] text-orange-500 mt-2 italic">* Regenerate to change structure.</p>
                                 </div>
                             ) : (
                                 <div>
                                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content</label>
                                     <textarea value={p.content} onFocus={handleInputFocus} onChange={(e) => handleUpdatePage(p.id, 'content', e.target.value)} className="w-full h-64 p-3 rounded-xl border border-slate-200 font-medium text-slate-700 resize-none text-sm leading-relaxed" />
                                 </div>
                             )}
                         </div>
                     )
                 })}
              </div>

              <div className="flex gap-3 mt-auto pt-2">
                   <button onClick={handleDownloadPDF} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-[20px] font-bold shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2 border border-slate-200">
                       <Download size={20} />
                   </button>
                   <button onClick={handleSharePDF} className="flex-[3] bg-slate-900 text-white py-4 rounded-[20px] font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                       <Share2 size={20} /> <span>{t('btn_share', language)}</span>
                   </button>
              </div>

              {/* Hidden PDF Container */}
              <div className="fixed left-[-9999px] top-0 w-[210mm]">
                  <div id="kp-container">
                      {kpData.pages.map((p, i) => renderStylishA4(p, i, kpData.pages.length))}
                  </div>
              </div>
           </div>
        )}

        {/* GENERIC FLOW */}
        {step === 'initial' && (
           <div className="space-y-4 animate-slide-up">
              <div className="glass-card p-1 rounded-[24px] shadow-lg border-white relative bg-white/60">
                 <textarea onFocus={handleInputFocus} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('design_input_placeholder', language)} className="w-full h-40 bg-transparent rounded-[20px] p-5 text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-none resize-none" />
              </div>
              <button onClick={handleStartGeneric} disabled={!description} className={`w-full py-5 rounded-[22px] shadow-xl flex items-center justify-center gap-2 text-[17px] font-bold transition-all ${!description ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white active:scale-95'}`}><span>{t('btn_generate', language)}</span><ArrowRight size={20} className="text-white/50" /></button>
           </div>
        )}
        
        {step === 'analyzing' && <div className="h-[60vh] flex flex-col items-center justify-center"><LoadingSpinner /></div>}
        
        {step === 'questions' && (
          <div className="animate-slide-up space-y-6">
            <div className="glass-card p-5 rounded-[24px] border-l-4 border-purple-500 bg-white">
              <h3 className="font-bold text-lg mb-1">Briefing</h3>
            </div>
            {currentQuestions.map((q, idx) => (
              <div key={idx} className="space-y-3">
                <p className="font-bold text-slate-800 ml-2 text-sm">{q}</p>
                <input type="text" onFocus={handleInputFocus} className="w-full glass-input px-5 py-4 rounded-[20px] text-slate-900 bg-white border-slate-200" placeholder="..." value={currentAnswers[idx] || ''} onChange={(e) => setCurrentAnswers({...currentAnswers, [idx]: e.target.value})} />
              </div>
            ))}
            <button onClick={handleSubmitAnswers} className="w-full bg-purple-600 text-white font-bold py-5 rounded-[22px] shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"><span>Complete (20 💎)</span><Zap size={20} className="fill-white"/></button>
          </div>
        )}
        
        {step === 'result' && (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="glass-panel p-6 rounded-[24px] mb-4 text-sm text-slate-800 leading-relaxed shadow-lg overflow-y-auto flex-1 border border-white bg-white/80">
               <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:my-2 prose-strong:text-slate-900">
                 <ReactMarkdown className="react-markdown">{result}</ReactMarkdown>
               </div>
            </div>
            <div className="flex gap-3 mt-auto">
               <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="flex-1 bg-slate-100 text-slate-900 font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">{copied ? <Check size={20} /> : <Copy size={20} />}<span>Копировать</span></button>
               <button onClick={() => { if(navigator.share) navigator.share({ title: 'Проект', text: result }) }} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"><Share2 size={20} /><span>Поделиться</span></button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
