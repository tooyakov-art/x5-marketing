
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bot, MessageCircle, Send, Sparkles, Zap, Check, Clock, Users, ArrowRight, Phone, Shield, BarChart3, Mic, Image, Smile, MoreVertical } from 'lucide-react';
import { ViewProps } from '../types';
import { t } from '../services/translations';
import { motion, AnimatePresence } from 'framer-motion';

export const WhatsAppBotView: React.FC<ViewProps> = ({ onBack, user, language = 'ru', onNavigate }) => {
  const [botName, setBotName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [demoMessages, setDemoMessages] = useState<{text: string, isBot: boolean}[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    { icon: MessageCircle, title: language === 'ru' ? 'Мгновенные ответы' : 'Instant Replies', desc: language === 'ru' ? '24/7 без перерывов' : '24/7 non-stop', color: 'from-blue-500 to-cyan-500' },
    { icon: Users, title: language === 'ru' ? 'Сбор лидов' : 'Lead Collection', desc: language === 'ru' ? 'Автоматически' : 'Automated', color: 'from-purple-500 to-pink-500' },
    { icon: BarChart3, title: language === 'ru' ? 'Аналитика' : 'Analytics', desc: language === 'ru' ? 'Статистика чатов' : 'Chat statistics', color: 'from-orange-500 to-red-500' },
    { icon: Shield, title: language === 'ru' ? 'Безопасность' : 'Security', desc: language === 'ru' ? 'Шифрование' : 'Encryption', color: 'from-emerald-500 to-teal-500' },
  ];

  const businessTypes = [
    { id: 'shop', label: language === 'ru' ? 'Интернет-магазин' : 'Online Store', emoji: '🛍️' },
    { id: 'service', label: language === 'ru' ? 'Услуги' : 'Services', emoji: '✂️' },
    { id: 'restaurant', label: language === 'ru' ? 'Ресторан/Кафе' : 'Restaurant', emoji: '🍽️' },
    { id: 'clinic', label: language === 'ru' ? 'Клиника' : 'Clinic', emoji: '🏥' },
    { id: 'education', label: language === 'ru' ? 'Обучение' : 'Education', emoji: '📚' },
    { id: 'other', label: language === 'ru' ? 'Другое' : 'Other', emoji: '💼' },
  ];

  // Demo chat simulation
  useEffect(() => {
    if (showDemo && demoMessages.length === 0) {
      const messages = language === 'ru' ? [
        { text: 'Привет! Сколько стоит доставка?', isBot: false },
        { text: 'Здравствуйте! 👋 Доставка по городу бесплатная при заказе от 5000₸. Стандартная доставка - 1000₸. Чем еще могу помочь?', isBot: true },
        { text: 'А когда доставите?', isBot: false },
        { text: 'Доставка в течение 1-2 часов! 🚀 Хотите оформить заказ?', isBot: true },
      ] : [
        { text: 'Hi! How much is delivery?', isBot: false },
        { text: 'Hello! 👋 Free delivery for orders over $50. Standard delivery - $5. How else can I help?', isBot: true },
        { text: 'When will it arrive?', isBot: false },
        { text: 'Delivery within 1-2 hours! 🚀 Would you like to place an order?', isBot: true },
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < messages.length) {
          setDemoMessages(prev => [...prev, messages[index]]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showDemo, language]);

  const handleCreate = async () => {
    if (!botName.trim() || !businessType) return;

    setIsCreating(true);
    await new Promise(r => setTimeout(r, 2500));
    setIsCreating(false);
    setStep(3);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in bg-gray-50">

      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600"
          >
            <ChevronLeft size={24} />
          </motion.button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>

          <div className="flex-1">
            <h1 className="text-gray-900 font-bold">WhatsApp Bot</h1>
            <p className="text-xs text-emerald-500 font-medium">
              {language === 'ru' ? 'AI Ассистент' : 'AI Assistant'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <Phone size={20} />
            <MoreVertical size={20} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Step 1: Info & Demo */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5"
            >
              {/* Hero Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 p-6 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4"
                  >
                    <Bot size={32} className="text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-black text-white mb-2">
                    {language === 'ru' ? 'Умный бот для бизнеса' : 'Smart Business Bot'}
                  </h2>
                  <p className="text-white/80 text-sm mb-4">
                    {language === 'ru'
                      ? 'Автоматизируйте общение с клиентами и увеличьте продажи'
                      : 'Automate customer communication and increase sales'
                    }
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                      <Zap size={14} className="text-yellow-300" />
                      <span className="text-xs font-bold text-white">20 {language === 'ru' ? 'кредитов' : 'credits'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                      <Clock size={14} className="text-white" />
                      <span className="text-xs font-bold text-white">24/7</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Interactive Demo */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {language === 'ru' ? 'Как это работает' : 'How it works'}
                  </h3>
                  {!showDemo && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDemo(true)}
                      className="text-xs font-bold text-emerald-500 flex items-center gap-1"
                    >
                      {language === 'ru' ? 'Показать демо' : 'Show demo'} <ArrowRight size={12} />
                    </motion.button>
                  )}
                </div>

                {/* Chat Demo - Keeping dark to match actual WhatsApp */}
                <div className="bg-[#0b141a] rounded-2xl border border-gray-200 overflow-hidden shadow-md">
                  {/* Chat Header */}
                  <div className="bg-[#1f2c34] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Your Bot</p>
                      <p className="text-emerald-400 text-[10px]">{language === 'ru' ? 'онлайн' : 'online'}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-3 min-h-[180px] bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-repeat">
                    {!showDemo ? (
                      <div className="flex items-center justify-center h-full text-white/40 text-sm">
                        {language === 'ru' ? 'Нажмите "Показать демо"' : 'Click "Show demo"'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {demoMessages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                              msg.isBot
                                ? 'bg-[#1f2c34] text-white rounded-tl-none'
                                : 'bg-emerald-600 text-white rounded-tr-none'
                            }`}>
                              {msg.text}
                              <div className="text-[10px] text-white/50 text-right mt-1">
                                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {showDemo && demoMessages.length < 4 && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="flex justify-start"
                          >
                            <div className="bg-[#1f2c34] px-4 py-2 rounded-lg text-white/60 text-sm">
                              ...
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="bg-[#1f2c34] p-2 flex items-center gap-2">
                    <Smile size={20} className="text-white/40" />
                    <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-white/40 text-sm">
                      {language === 'ru' ? 'Сообщение' : 'Message'}
                    </div>
                    <Mic size={20} className="text-white/40" />
                  </div>
                </div>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                {features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                      <feature.icon size={18} className="text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-0.5">{feature.title}</h4>
                    <p className="text-[10px] text-gray-500">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                <span>{language === 'ru' ? 'Создать бота' : 'Create Bot'}</span>
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5"
            >
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-1 rounded-full bg-emerald-500" />
                <div className="flex-1 h-1 rounded-full bg-emerald-500" />
                <div className="flex-1 h-1 rounded-full bg-gray-200" />
              </div>

              <h2 className="text-xl font-black text-gray-900 mb-2">
                {language === 'ru' ? 'Настройка бота' : 'Bot Setup'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {language === 'ru' ? 'Расскажите о вашем бизнесе' : 'Tell us about your business'}
              </p>

              {/* Bot Name */}
              <div className="mb-5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  {language === 'ru' ? 'Имя бота' : 'Bot Name'}
                </label>
                <input
                  value={botName}
                  onChange={e => setBotName(e.target.value)}
                  placeholder={language === 'ru' ? 'Например: Помощник магазина' : 'e.g. Store Assistant'}
                  className="w-full bg-white p-4 rounded-2xl text-gray-900 placeholder-gray-400 border border-gray-200 outline-none focus:border-emerald-500 transition-colors shadow-sm"
                />
              </div>

              {/* Business Type */}
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                  {language === 'ru' ? 'Тип бизнеса' : 'Business Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {businessTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBusinessType(type.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        businessType === type.id
                          ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                          : 'bg-white border-gray-200 text-gray-600 shadow-sm'
                      }`}
                    >
                      <span className="text-xl mb-1 block">{type.emoji}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold"
                >
                  {t('btn_back', language)}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreate}
                  disabled={!botName.trim() || !businessType || isCreating}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>{language === 'ru' ? 'Создаем...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>{language === 'ru' ? 'Создать' : 'Create'}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={48} className="text-white" />
              </motion.div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">
                {language === 'ru' ? 'Заявка отправлена!' : 'Request Sent!'}
              </h2>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                {language === 'ru'
                  ? 'Наш менеджер свяжется с вами в WhatsApp для настройки бота'
                  : 'Our manager will contact you on WhatsApp to set up the bot'
                }
              </p>

              {/* Bot Card */}
              <div className="bg-white rounded-2xl p-5 mb-6 text-left border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Bot size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{botName}</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <p className="text-xs text-yellow-600 font-medium">
                        {language === 'ru' ? 'Ожидает настройки' : 'Pending setup'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {businessTypes.find(t => t.id === businessType)?.emoji} {businessTypes.find(t => t.id === businessType)?.label}
                </div>
              </div>

              {/* Info */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm mb-1">
                  <Clock size={16} />
                  <span>{language === 'ru' ? 'Что дальше?' : 'What\'s next?'}</span>
                </div>
                <p className="text-xs text-emerald-400/70">
                  {language === 'ru'
                    ? 'Мы свяжемся с вами в течение 24 часов для обсуждения деталей и запуска бота'
                    : 'We\'ll contact you within 24 hours to discuss details and launch the bot'
                  }
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold"
              >
                {language === 'ru' ? 'Готово' : 'Done'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
