
import React, { useState, useRef } from 'react';
import { ChevronLeft, Zap, Rocket, Layout, Download, Share2, RefreshCw, Check, Sparkles, Lock } from 'lucide-react';
import { ViewProps, InstagramPost } from '../types';
import { generateInstagramPlan, generateImage } from '../services/geminiService';
import { LoadingSpinner } from '../components/GlassComponents';
import * as htmlToImage from 'html-to-image';
import { t } from '../services/translations';

export const InstagramView: React.FC<ViewProps> = ({ user, onBack, initialPrompt, language = 'ru', checkUsage, deductCredits }) => {
  const [step, setStep] = useState<'setup' | 'generating_text' | 'review' | 'generating_images' | 'results'>('setup');
  const [genMode, setGenMode] = useState<'standard' | 'pro'>('standard');
  
  // Inputs (Memory Only)
  const [inputs, setInputs] = useState({ company: '', description: initialPrompt || '', postCount: 3 });
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  
  // Refs for capturing
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleGeneratePlan = async () => {
    if (!inputs.company || !inputs.description) return;
    
    // Check credits for text generation (Standard tier)
    if (checkUsage && !checkUsage('standard', 1)) return;

    setStep('generating_text');

    const generatedPosts = await generateInstagramPlan(
        inputs.company, 
        inputs.description, 
        inputs.postCount, 
        language || 'ru'
    );
    
    setPosts(generatedPosts);
    setSelectedPostIds(generatedPosts.map(p => p.id));
    setStep('review');
  };

  const handleGenerateImages = async () => {
      if (selectedPostIds.length === 0) return;

      const costPerImage = genMode === 'pro' ? 20 : 5;
      const totalCost = selectedPostIds.length * costPerImage;
      
      // Only CHECK credits - do NOT deduct yet!
      if (checkUsage && !checkUsage(genMode, totalCost)) return;

      setStep('generating_images');
      
      const postsToProcess = posts.filter(p => selectedPostIds.includes(p.id));
      const updatedPosts = [...posts];
      
      let successCount = 0; // Track successful generations

      for (const post of postsToProcess) {
          const idx = updatedPosts.findIndex(p => p.id === post.id);
          if (idx === -1) continue;

          updatedPosts[idx].status = 'generating';
          setPosts([...updatedPosts]);

          let cleanBackgroundPrompt = `${post.visualPrompt}. Minimalist composition, clean negative space, soft lighting, high quality advertising photography. NO TEXT IN IMAGE.`;
          
          if (genMode === 'pro') {
              cleanBackgroundPrompt += " Ultra-detailed, 8k resolution, award winning photography.";
          }

          const response = await generateImage(
              cleanBackgroundPrompt, 
              'creative', 
              '1:1', 
              [], 
              genMode 
          );

          if (response.imageUrl) {
              updatedPosts[idx].generatedImageUrl = response.imageUrl;
              updatedPosts[idx].status = 'done';
              successCount++;
          } else {
              updatedPosts[idx].status = 'error';
          }
          setPosts([...updatedPosts]);
      }
      
      // Deduct credits ONLY for successfully generated images
      if (successCount > 0 && deductCredits) {
        deductCredits(successCount * costPerImage);
      }
      
      setStep('results');
  };

  const handleDownloadComposite = async (idx: number) => {
      const element = cardRefs.current[idx];
      if (!element) return;

      try {
          const dataUrl = await htmlToImage.toPng(element, { quality: 0.95, pixelRatio: 2 });
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `x5_post_${idx + 1}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      } catch (error) {
          alert('Error saving image.');
      }
  };

  const togglePostSelection = (id: string) => {
      setSelectedPostIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isPro = genMode === 'pro';

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in px-6 pt-16 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100"><ChevronLeft className="text-slate-900" size={22} /></button>
            <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{t('insta_title', language)}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isPro ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{isPro ? t('insta_mode_pro', language) : t('insta_mode_std', language)}</span>
                </div>
            </div>
          </div>
          <div className="glass-card px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-white/80 border-slate-200">
             <Zap size={14} className="text-yellow-500 fill-yellow-500" />
             <span className="text-xs font-extrabold text-slate-900">{user?.credits || 0}</span>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-48 scroll-smooth no-scrollbar">
          
          {step === 'setup' && (
              <div className="space-y-6 animate-slide-up">
                  
                  {/* Mode Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-[24px] border border-slate-200">
                      <button 
                        onClick={() => setGenMode('standard')} 
                        className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${!isPro ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <div className="flex items-center gap-1.5">
                              <Rocket size={16} className={!isPro ? "text-blue-500" : ""} />
                              <span className="text-[13px]">{t('insta_mode_std', language)}</span>
                          </div>
                          <span className="text-[10px] opacity-60">1x</span>
                      </button>
                      <button 
                        onClick={() => {
                            if (user?.plan === 'free') {
                                alert("Pro mode is available for subscribers only.");
                                return;
                            }
                            setGenMode('pro');
                        }} 
                        className={`flex-1 py-4 rounded-[20px] text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${isPro ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <div className="flex items-center gap-1.5">
                              {user?.plan === 'free' ? (
                                  <Lock size={16} className="text-slate-400" />
                              ) : (
                                  <Sparkles size={16} className={isPro ? "text-yellow-400" : ""} />
                              )}
                              <span className="text-[13px]">{t('insta_mode_pro', language)}</span>
                          </div>
                          <span className="text-[10px] opacity-60">4x</span>
                      </button>
                  </div>

                  {/* Input Form with conditional styling */}
                  <div className={`glass-card p-6 rounded-[32px] space-y-4 transition-all duration-300 ${isPro ? 'bg-purple-50/50 border-purple-200 shadow-lg shadow-purple-100/50' : 'bg-white/80'}`}>
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">{t('insta_topic', language)}</label>
                          <input value={inputs.company} onChange={(e) => setInputs({...inputs, company: e.target.value})} className="w-full bg-white p-4 rounded-[20px] font-bold text-slate-900 mt-2 outline-none border border-slate-100 focus:border-blue-300 transition-all text-sm" placeholder="..." />
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">{t('insta_desc', language)}</label>
                          <textarea value={inputs.description} onChange={(e) => setInputs({...inputs, description: e.target.value})} className="w-full h-32 bg-white p-4 rounded-[20px] font-medium text-slate-900 mt-2 outline-none resize-none border border-slate-100 focus:border-blue-300 transition-all text-sm leading-relaxed" placeholder="..." />
                      </div>
                  </div>
                  
                  <button onClick={handleGeneratePlan} className={`w-full py-5 rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-200' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                      <Layout size={20} /> <span>{t('insta_btn_plan', language)}</span>
                  </button>
              </div>
          )}

          {(step === 'generating_text' || step === 'generating_images') && (
              <div className="h-[60vh] flex flex-col items-center justify-center">
                  <LoadingSpinner />
                  <p className="text-sm text-slate-500 mt-4 animate-pulse">AI is thinking...</p>
              </div>
          )}

          {step === 'review' && (
              <div className="space-y-4 animate-slide-up">
                  {posts.map(post => (
                      <div key={post.id} onClick={() => togglePostSelection(post.id)} className={`glass-card p-5 rounded-[24px] border-2 cursor-pointer transition-all ${selectedPostIds.includes(post.id) ? 'border-purple-500 bg-purple-50/50' : 'border-transparent'}`}>
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-slate-900">{post.headline}</h3>
                              {selectedPostIds.includes(post.id) && <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white"><Check size={14}/></div>}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">{post.description}</p>
                      </div>
                  ))}
                  <button onClick={handleGenerateImages} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-2">
                      <Sparkles size={20} /> <span>{t('btn_generate', language)} ({selectedPostIds.length * (genMode === 'pro' ? 20 : 5)})</span>
                  </button>
              </div>
          )}

          {step === 'results' && (
              <div className="space-y-8 animate-slide-up">
                  {posts.filter(p => selectedPostIds.includes(p.id)).map((post, idx) => (
                      <div key={post.id} className="space-y-3">
                          {/* Capture Area */}
                          <div ref={(el) => { cardRefs.current[idx] = el; }} className="aspect-square relative rounded-[20px] overflow-hidden bg-white shadow-lg">
                              {post.generatedImageUrl ? (
                                  <img src={post.generatedImageUrl} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Error</div>
                              )}
                              
                              {/* Overlay Text */}
                              <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                  <h2 className="text-2xl font-black text-white leading-tight mb-2 drop-shadow-lg">{post.headline}</h2>
                                  <div className="bg-white/20 backdrop-blur-md self-start px-3 py-1 rounded-lg border border-white/30">
                                      <span className="text-xs font-bold text-white uppercase">{post.cta}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="flex gap-2">
                              <button onClick={() => handleDownloadComposite(idx)} className="flex-1 bg-white text-slate-900 py-3 rounded-[18px] font-bold shadow-sm border border-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                  <Download size={18} /> <span>{t('btn_save', language)}</span>
                              </button>
                              <button onClick={() => {if(navigator.share && post.generatedImageUrl) navigator.share({title: post.headline, url: post.generatedImageUrl})}} className="w-14 bg-slate-900 text-white rounded-[18px] flex items-center justify-center active:scale-95 transition-transform shadow-lg">
                                  <Share2 size={18} />
                              </button>
                          </div>
                          
                          <div className="bg-white p-4 rounded-[20px] border border-slate-100">
                              <p className="text-xs text-slate-500 font-medium">{post.description}</p>
                          </div>
                      </div>
                  ))}
                  
                  <button onClick={() => setStep('setup')} className="w-full py-4 text-slate-500 font-bold flex items-center justify-center gap-2">
                      <RefreshCw size={16} /> Start Over
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};
