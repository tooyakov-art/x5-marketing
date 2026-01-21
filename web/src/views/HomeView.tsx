
import React, { useState, useEffect, useRef } from 'react';
import { PenTool, ShieldCheck, Sparkles, LayoutGrid, Instagram, Smartphone, PlayCircle, Zap, Box, Tag, Lock, Globe, BarChart2, MessageCircle, Shuffle, Bot, Wand2, Rocket, ArrowRight, ChevronRight, Crown, Gift } from 'lucide-react';
import { ViewState, ViewProps } from '../types';
import { t } from '../services/translations';
import { motion, AnimatePresence } from 'framer-motion';

export const HomeView: React.FC<ViewProps> = ({ onNavigate, user, language = 'ru' }) => {

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showRandomizer, setShowRandomizer] = useState(false);
  const [randomResult, setRandomResult] = useState<number | null>(null);
  const [minNum, setMinNum] = useState(1);
  const [maxNum, setMaxNum] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapPhase, setTapPhase] = useState<'tap' | 'spin' | 'result'>('tap');
  const [showSparks, setShowSparks] = useState(false);
  const tapRequired = 10; // Нужно тапнуть 10 раз

  // Dynamic Content Arrays inside component to use current 'language'
  const bannerStyles = [
    {
        id: 'ads',
        headline: t('home_banner_ads', language),
        sub: t('home_banner_ads_desc', language),
        img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
        view: 'photo'
    },
    {
        id: 'lookbook',
        headline: t('home_banner_lookbook', language),
        sub: t('home_banner_lookbook_desc', language),
        img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
        view: 'photo'
    },
    {
        id: 'cyber',
        headline: t('home_banner_cyber', language),
        sub: t('home_banner_cyber_desc', language),
        img: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80',
        view: 'photo'
    },
    {
        id: 'product',
        headline: t('home_banner_product', language),
        sub: t('home_banner_product_desc', language),
        img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        view: 'photo'
    },
  ];

  const featuredTools = [
    {
      id: 'instagram',
      label: t('home_tool_insta', language),
      sub: t('home_tool_insta_desc', language),
      icon: Instagram,
      gradient: 'from-pink-500 to-rose-500',
      isPro: false
    },
    {
      id: 'video',
      label: t('home_tool_video', language),
      sub: t('home_tool_video_desc', language),
      icon: Smartphone,
      gradient: 'from-indigo-500 to-purple-500',
      isPro: true
    },
    {
      id: 'logo',
      label: t('home_tool_logo', language),
      sub: t('home_tool_logo_desc', language),
      icon: Box,
      gradient: 'from-orange-500 to-amber-500',
      isPro: true
    },
    {
      id: 'branding',
      label: t('home_tool_brand', language),
      sub: t('home_tool_brand_desc', language),
      icon: Tag,
      gradient: 'from-emerald-500 to-teal-500',
      isPro: true
    }
  ];

  const categories = [
    { id: 'design', label: t('tool_design', language), icon: PenTool, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'contract', label: t('tool_contract', language), icon: ShieldCheck, gradient: 'from-emerald-500 to-green-500' },
    { id: 'courses', label: t('tool_courses', language), icon: Sparkles, gradient: 'from-orange-500 to-yellow-500' },
    { id: 'all_tech', label: t('tool_all', language), icon: LayoutGrid, gradient: 'from-slate-600 to-slate-800' },
  ];

  // Randomizer number generator for giveaways - EXCITING VERSION
  const handleRandomize = () => {
    if (minNum >= maxNum) return;
    setIsSpinning(true);
    setRandomResult(null);

    const finalResult = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    let count = 0;
    const totalSpins = 30; // More spins for longer suspense

    const spin = () => {
      // Start fast, slow down exponentially (like a slot machine)
      const progress = count / totalSpins;
      const delay = 50 + Math.pow(progress, 2) * 400; // 50ms -> 450ms

      setRandomResult(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
      count++;

      if (count < totalSpins) {
        setTimeout(spin, delay);
      } else {
        // Final reveal with a pause for drama
        setTimeout(() => {
          setRandomResult(null);
          setTimeout(() => {
            setRandomResult(finalResult);
            setIsSpinning(false);
            setTapPhase('result');
            // Vibrate on mobile if supported
            if (navigator.vibrate) {
              navigator.vibrate([100, 50, 200]);
            }
          }, 200);
        }, 300);
      }
    };

    spin();
  };

  // Reset and try again
  const handleTryAgain = () => {
    setTapCount(0);
    setTapPhase('tap');
    setRandomResult(null);
  };

  const openRandomizer = () => {
    setShowRandomizer(true);
    setRandomResult(null);
    setTapCount(0);
    setTapPhase('tap');
  };

  // Tap to charge the randomizer!
  const handleTap = () => {
    if (tapPhase !== 'tap' || minNum >= maxNum) return;

    const newCount = tapCount + 1;
    setTapCount(newCount);
    setShowSparks(true);
    setTimeout(() => setShowSparks(false), 150);

    // Vibrate on each tap
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // When enough taps - auto spin!
    if (newCount >= tapRequired) {
      setTapPhase('spin');
      setTimeout(() => handleRandomize(), 300);
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInteracting && scrollRef.current) {
        const nextIndex = (activeIndex + 1) % bannerStyles.length;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({ left: nextIndex * width, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, isInteracting, bannerStyles.length]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      if (index !== activeIndex) setActiveIndex(index);
    }
  };

  const handleToolClick = (toolId: string, isPro: boolean) => {
      if (isPro && user?.plan === 'free') {
          onNavigate && onNavigate('paywall');
          return;
      }
      onNavigate && onNavigate(toolId as ViewState);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-32 px-5 pt-14 animate-fade-in scrolling-touch md:pt-8 md:pb-12 bg-[#f8f9fb]">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6 shrink-0 relative z-20"
      >
        <div>
           <div className="flex items-center gap-2 mb-1">
             <motion.div
               whileHover={{ rotate: 360 }}
               transition={{ duration: 0.5 }}
               className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-lg shadow-slate-900/20"
             >
                <span className="font-black text-xs">X5</span>
             </motion.div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('creative_os', language)}</span>
           </div>
           <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
             {t('welcome', language)}, <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{user?.name.split(' ')[0] || 'User'}</span>
           </h1>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onNavigate && onNavigate('language')}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 border border-slate-100 text-slate-600"
            >
                <Globe size={18} />
            </motion.button>

            {/* Credit Badge */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate && onNavigate('paywall')}
              className="glass-card px-4 py-2 rounded-full flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20 h-10"
            >
                <Zap size={14} className="text-white fill-white" />
                <span className="text-xs font-black text-white">{user?.credits || 0}</span>
            </motion.button>
        </div>
      </motion.div>

      {/* BIG PHOTO LAB BANNER - Swiping Enabled */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5 relative rounded-[28px] shadow-2xl shadow-slate-900/10 overflow-hidden h-56 md:h-72 group shrink-0"
      >

        {/* Label */}
        <div className="absolute top-5 left-5 z-30 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-2">
                <Wand2 size={14} className="text-white" />
                <span className="text-xs font-bold text-white">{t('tool_photo', language)}</span>
            </div>
        </div>

        {/* Scroll Container */}
        <div
           ref={scrollRef}
           onScroll={handleScroll}
           onTouchStart={() => setIsInteracting(true)}
           onTouchEnd={() => setTimeout(() => setIsInteracting(false), 2000)}
           className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth touch-pan-x touch-pan-y"
        >
           {bannerStyles.map((style) => (
              <motion.button
                 key={style.id}
                 whileTap={{ scale: 0.99 }}
                 onClick={() => onNavigate && onNavigate(style.view as ViewState)}
                 className="relative min-w-full h-full snap-center flex-shrink-0 text-left"
              >
                 <img
                    src={style.img}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt={style.headline}
                    draggable={false}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                 <div className="absolute inset-0 p-6 flex flex-col justify-end items-start z-10">
                    <h3 className="text-2xl md:text-4xl font-black text-white leading-tight mb-1 tracking-tight drop-shadow-xl max-w-[90%]">
                        {style.headline}
                    </h3>
                    <p className="text-sm text-white/80 font-medium mb-3">
                        {style.sub}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span>{t('courses_start', language)}</span>
                      <ArrowRight size={12} />
                    </div>
                 </div>
              </motion.button>
           ))}
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 right-6 flex gap-1.5 z-20 pointer-events-none">
           {bannerStyles.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`}
              />
           ))}
        </div>
      </motion.div>

      {/* NEW: Special Tools Row - Randomizer & WhatsApp Bot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3 mb-4 shrink-0"
      >
        {/* Randomizer Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={openRandomizer}
          className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 shadow-xl shadow-purple-500/20 text-left"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"
          />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Shuffle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('home_randomizer', language)}</h3>
              <p className="text-[10px] text-white/70 font-medium">{t('home_randomizer_desc', language)}</p>
            </div>
          </div>
        </motion.button>

        {/* WhatsApp Bot Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate && onNavigate('whatsapp_bot')}
          className="relative h-28 rounded-2xl overflow-hidden bg-white p-4 shadow-lg shadow-slate-200/50 border border-slate-100 text-left"
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('home_whatsapp_bot', language)}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{t('home_whatsapp_bot_desc', language)}</p>
            </div>
          </div>
          {/* New Badge */}
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
            NEW
          </div>
        </motion.button>
      </motion.div>

      {/* Featured Grid - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 mb-4 shrink-0"
      >
         {featuredTools.map((tool, index) => {
           const isLocked = tool.isPro && user?.plan === 'free';
           return (
           <motion.button
             key={tool.id}
             whileTap={{ scale: 0.95 }}
             onClick={() => handleToolClick(tool.id, tool.isPro)}
             className={`relative h-32 rounded-2xl p-4 flex flex-col justify-between items-start text-left overflow-hidden bg-white shadow-lg shadow-slate-200/50 border border-slate-100`}
           >
             <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg`}>
                <tool.icon size={20} className="text-white" />
             </div>

             <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{tool.label}</h3>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{tool.sub}</p>
             </div>

             {isLocked && (
                 <div className="absolute top-3 right-3">
                   <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                       <Lock size={12} className="text-slate-400" />
                   </div>
                 </div>
             )}
           </motion.button>
         )})}
      </motion.div>

      {/* Veo (Full Width) - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-4 shrink-0"
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
           onClick={() => handleToolClick('video_gen', true)}
           className="w-full relative h-20 rounded-2xl overflow-hidden shadow-lg shadow-purple-200/50 group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600"></div>

            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>

            {user?.plan === 'free' && (
                 <div className="absolute top-3 right-3 z-20">
                   <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                       <Lock size={12} className="text-white" />
                   </div>
                 </div>
            )}

            <div className="absolute inset-0 flex items-center px-5 gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                    <PlayCircle size={24} />
                </div>
                <div className="text-left flex-1">
                    <h3 className="text-base font-bold text-white">{t('home_veo_title', language)}</h3>
                    <p className="text-xs text-white/70">{t('home_veo_desc', language)}</p>
                </div>
                <ChevronRight size={20} className="text-white/50" />
            </div>
        </motion.button>
      </motion.div>

      {/* Classic Tools Grid - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3 mb-4 shrink-0"
      >
        {categories.map((cat, index) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate && onNavigate(cat.id as ViewState)}
            className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm border border-slate-100 min-h-[64px]"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-md`}>
              <cat.icon size={18} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800 leading-tight text-left">{cat.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* System Core (Analytics) - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6 shrink-0"
      >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate && onNavigate('analytics')}
            className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100"
          >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg">
                  <BarChart2 size={22} />
              </div>
              <div className="text-left flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{t('analytics_title', language)}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{t('analytics_subtitle', language)}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
          </motion.button>
      </motion.div>

      {/* Randomizer Modal - EXCITING TAP VERSION */}
      <AnimatePresence>
        {showRandomizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => !isSpinning && tapPhase !== 'spin' && setShowRandomizer(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-b from-slate-900 to-purple-950 rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden border border-purple-500/30"
            >
              {/* Range Inputs - Always at top */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-purple-300/70 uppercase tracking-wide mb-1 block">
                    {language === 'ru' ? 'От' : language === 'kz' ? 'Бастап' : 'From'}
                  </label>
                  <input
                    type="number"
                    value={minNum}
                    onChange={e => setMinNum(parseInt(e.target.value) || 0)}
                    disabled={tapPhase !== 'tap'}
                    className="w-full bg-black/40 border border-purple-500/30 px-4 py-2 rounded-xl text-center text-lg font-bold text-white outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-purple-300/70 uppercase tracking-wide mb-1 block">
                    {language === 'ru' ? 'До' : language === 'kz' ? 'Дейін' : 'To'}
                  </label>
                  <input
                    type="number"
                    value={maxNum}
                    onChange={e => setMaxNum(parseInt(e.target.value) || 0)}
                    disabled={tapPhase !== 'tap'}
                    className="w-full bg-black/40 border border-purple-500/30 px-4 py-2 rounded-xl text-center text-lg font-bold text-white outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* TAP PHASE - Big interactive area */}
              {tapPhase === 'tap' && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  {/* Tap Area */}
                  <motion.button
                    onPointerDown={handleTap}
                    animate={showSparks ? { scale: [1, 0.95, 1] } : {}}
                    transition={{ duration: 0.1 }}
                    className="w-full aspect-square rounded-3xl bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800 flex flex-col items-center justify-center relative overflow-hidden select-none touch-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* Animated rings */}
                    <motion.div
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute w-40 h-40 rounded-full border-4 border-white/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                      className="absolute w-40 h-40 rounded-full border-4 border-white/20"
                    />

                    {/* Spark effect on tap */}
                    <AnimatePresence>
                      {showSparks && (
                        <>
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, x: 0, y: 0 }}
                              animate={{
                                scale: [0, 1, 0],
                                x: Math.cos(i * 45 * Math.PI / 180) * 80,
                                y: Math.sin(i * 45 * Math.PI / 180) * 80,
                              }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
                            />
                          ))}
                        </>
                      )}
                    </AnimatePresence>

                    {/* Center icon */}
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: tapCount * 36
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4"
                    >
                      <Gift size={48} className="text-white" />
                    </motion.div>

                    {/* Tap counter */}
                    <motion.div
                      key={tapCount}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className="text-5xl font-black text-white mb-2"
                      style={{ textShadow: '0 0 30px rgba(255,255,255,0.5)' }}
                    >
                      {tapCount}/{tapRequired}
                    </motion.div>

                    <p className="text-lg font-bold text-white/80">
                      {language === 'ru' ? '👆 ТАПАЙ!' : language === 'kz' ? '👆 БАС!' : '👆 TAP!'}
                    </p>

                    {/* Progress bar */}
                    <div className="absolute bottom-4 left-4 right-4 h-2 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${(tapCount / tapRequired) * 100}%` }}
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full"
                        style={{ boxShadow: '0 0 20px rgba(255,165,0,0.7)' }}
                      />
                    </div>
                  </motion.button>

                  <p className="text-center text-xs text-purple-300/60 mt-3">
                    {language === 'ru' ? 'Нажимай быстрее!' : language === 'kz' ? 'Тезірек бас!' : 'Tap faster!'}
                  </p>
                </motion.div>
              )}

              {/* SPIN PHASE - Slot machine effect */}
              {(tapPhase === 'spin' || tapPhase === 'result') && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  {/* Result Display */}
                  <motion.div
                    animate={isSpinning ? {
                      scale: [1, 1.02, 1],
                      boxShadow: ['0 0 0 0 rgba(168, 85, 247, 0)', '0 0 60px 20px rgba(168, 85, 247, 0.6)', '0 0 0 0 rgba(168, 85, 247, 0)']
                    } : {}}
                    transition={{ duration: 0.2, repeat: isSpinning ? Infinity : 0 }}
                    className="relative bg-black/50 rounded-3xl p-8 mb-4 overflow-hidden border-2 border-purple-500/50"
                  >
                    {/* Slot machine style background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 via-transparent to-purple-900/50" />

                    {/* Flying numbers background when spinning */}
                    {isSpinning && (
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [-50, 300] }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: 'linear'
                            }}
                            className="absolute text-4xl font-black text-purple-500/20"
                            style={{ left: `${10 + i * 9}%` }}
                          >
                            {Math.floor(Math.random() * 100)}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Main number */}
                    <motion.p
                      key={randomResult}
                      initial={{ scale: 2, opacity: 0, y: isSpinning ? -100 : 0 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className={`text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 text-center relative z-10 ${isSpinning ? 'blur-[2px]' : ''}`}
                      style={{ textShadow: '0 0 40px rgba(168,85,247,0.8)' }}
                    >
                      {randomResult ?? '?'}
                    </motion.p>

                    {/* Winner glow on result */}
                    {tapPhase === 'result' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 via-transparent to-transparent"
                      />
                    )}
                  </motion.div>

                  {/* Status text */}
                  <motion.p
                    animate={isSpinning ? { opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
                    className="text-center text-lg font-bold text-purple-300 mb-4"
                  >
                    {isSpinning
                      ? (language === 'ru' ? '🎰 Крутится...' : language === 'kz' ? '🎰 Айналуда...' : '🎰 Spinning...')
                      : (language === 'ru' ? '🎉 ПОБЕДИТЕЛЬ!' : language === 'kz' ? '🎉 ЖЕҢІМПАЗ!' : '🎉 WINNER!')}
                  </motion.p>

                  {/* Try Again button */}
                  {tapPhase === 'result' && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTryAgain}
                      className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-purple-500/30"
                    >
                      <Shuffle size={24} />
                      <span>{language === 'ru' ? 'ЕЩЁ РАЗ!' : language === 'kz' ? 'ТАҒЫ!' : 'AGAIN!'}</span>
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Close button */}
              {!isSpinning && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowRandomizer(false)}
                  className="w-full mt-3 py-2 text-purple-400/60 text-sm font-medium"
                >
                  {language === 'ru' ? 'Закрыть' : language === 'kz' ? 'Жабу' : 'Close'}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
