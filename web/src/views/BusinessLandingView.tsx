
import React from 'react';
import { ChevronLeft, Zap, Users, GraduationCap, BarChart3, Palette, MessageSquare, Bot, Shield, ArrowRight, Building2, Sparkles, CheckCircle2, Star } from 'lucide-react';
import { ViewProps } from '../types';

export const BusinessLandingView: React.FC<ViewProps> = ({ onBack }) => {

  const whatsappLink = 'https://wa.me/77776203937?text=' + encodeURIComponent('Здравствуйте! Интересует X5 для бизнеса.');

  const features = [
    {
      icon: GraduationCap,
      title: 'Корпоративное обучение',
      desc: 'Создавайте курсы для сотрудников. Купите один раз — дайте доступ всей команде. Отслеживайте прогресс.',
      color: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50'
    },
    {
      icon: Zap,
      title: 'AI кредиты для команды',
      desc: 'Выдавайте кредиты сотрудникам для генерации контента, дизайна и маркетинговых материалов.',
      color: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-50'
    },
    {
      icon: Palette,
      title: 'Дизайн и брендинг',
      desc: 'AI дизайнер создаст логотипы, визитки, презентации, посты и сторис для вашей компании.',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50'
    },
    {
      icon: BarChart3,
      title: 'Маркетинг и аналитика',
      desc: 'Контент-план для Instagram, генерация постов, сторис, Reels сценариев. Трекинг ссылок.',
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50'
    },
    {
      icon: MessageSquare,
      title: 'Чат и HR-биржа',
      desc: 'Наймите фрилансеров из биржи. Общайтесь через встроенный чат с фото, видео и голосовыми.',
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50'
    },
    {
      icon: Bot,
      title: 'WhatsApp бот',
      desc: 'Создайте чат-бота для WhatsApp. Автоматизируйте ответы клиентам 24/7.',
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50'
    },
    {
      icon: Shield,
      title: 'Договоры и документы',
      desc: 'AI генерирует договоры, NDA, оферты. Юридическая безопасность для вашего бизнеса.',
      color: 'from-slate-600 to-slate-800',
      bg: 'bg-slate-50'
    },
    {
      icon: Users,
      title: 'Управление командой',
      desc: 'Один аккаунт компании — много сотрудников. Распределяйте роли, кредиты и доступы.',
      color: 'from-cyan-500 to-blue-600',
      bg: 'bg-cyan-50'
    }
  ];

  const testimonials = [
    { name: 'Erzhan B.', company: 'Digital Agency', text: 'X5 заменил нам 3 сервиса. Экономим 150,000 тенге в месяц.' },
    { name: 'Asel K.', company: 'E-commerce', text: 'Контент-план на месяц за 5 минут. Команда в восторге.' },
    { name: 'Marat T.', company: 'Startup', text: 'Обучили 20 сотрудников через курсы X5. Результат виден.' }
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in bg-white overflow-y-auto no-scrollbar">
      {/* Hero */}
      <div className="relative min-h-[85vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-black">
          <div className="absolute top-[-20%] right-[-30%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[100px]" />
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-50 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="relative z-10 px-8 pb-16 pt-24">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-6">
            <Building2 size={14} className="text-blue-400" />
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Для бизнеса</span>
          </div>

          <h1 className="text-[42px] font-black text-white leading-[1.05] mb-6 tracking-tight">
            X5 Marketing<br/>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">для вашей</span><br/>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">команды</span>
          </h1>

          <p className="text-lg text-slate-300 font-medium leading-relaxed mb-8 max-w-md">
            Все инструменты маркетинга, дизайна, обучения и автоматизации — в одном приложении.
          </p>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-2xl shadow-green-500/30 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.593-.826-6.336-2.206l-.442-.332-3.24 1.086 1.086-3.24-.332-.442A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
            Связаться в WhatsApp
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 py-10 bg-gradient-to-b from-black to-slate-900">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-black text-white">8+</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">AI инструментов</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-white">24/7</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Доступность</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-white">50%</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Экономия</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-12 bg-white">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Возможности</span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Всё что нужно бизнесу</h2>
          <p className="text-sm text-slate-500 mt-2">в одном приложении</p>
        </div>

        <div className="space-y-4">
          {features.map((f, idx) => (
            <div key={idx} className={`${f.bg} p-5 rounded-2xl border border-slate-100`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <f.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-6 py-12 bg-slate-50">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em]">Отзывы</span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Нам доверяют</h2>
        </div>

        <div className="space-y-4">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.name}</p>
                  <p className="text-[10px] text-slate-500">{t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing hint */}
      <div className="px-6 py-12 bg-white">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-[60px]" />
          <div className="relative z-10">
            <Sparkles size={28} className="text-yellow-400 mb-4" />
            <h3 className="text-xl font-black text-white mb-2">Готовы начать?</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Подключите X5 Marketing для вашей компании. Индивидуальные условия, персональный менеджер.
            </p>

            <div className="space-y-3 mb-8">
              {['Безлимитный доступ для команды', 'Приоритетная поддержка', 'Корпоративные курсы', 'AI кредиты по скидке'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                  <span className="text-sm text-white font-medium">{item}</span>
                </div>
              ))}
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-green-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-green-500/20 active:scale-95 transition-transform"
            >
              Написать в WhatsApp
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 bg-slate-50 text-center">
        <p className="text-xs text-slate-400 font-medium">X5 Marketing &copy; 2026</p>
        <p className="text-[10px] text-slate-300 mt-1">x5marketing.com</p>
      </div>
    </div>
  );
};
