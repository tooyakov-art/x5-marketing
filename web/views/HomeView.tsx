import React from 'react';
import { FileText, Sparkles, Zap } from 'lucide-react';
import { GlassButton } from '../components/GlassComponents';
import { HomeTabState } from '../types';

interface HomeViewProps {
  onNavigate: (view: HomeTabState) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-full px-6 pt-12 pb-24 overflow-y-auto">
      <div className="mb-10 text-center">
        <div className="inline-block px-4 py-1.5 mb-5 rounded-full bg-white/40 border border-white/60 backdrop-blur-sm shadow-sm">
          <span className="text-[11px] font-extrabold text-slate-900 tracking-[0.2em] uppercase font-sans">X5 OS</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-2 tracking-tight">
          Какая услуга вас<br/>интересует?
        </h1>
        <p className="text-slate-500 text-sm font-medium">Выберите инструмент X5</p>
      </div>

      <div className="space-y-3">
        <GlassButton 
          title="Составить Договор" 
          subtitle="Юридический ИИ"
          icon={FileText}
          colorClass="text-blue-600"
          onClick={() => onNavigate('contracts')}
        />

        <GlassButton 
          title="Создать Креатив" 
          subtitle="Генерация идей"
          icon={Zap}
          colorClass="text-pink-600"
          onClick={() => onNavigate('design')}
        />
        
        <div className="mt-8 pt-6 border-t border-slate-200/50">
           <GlassButton 
            title="Комплекс (Сайт + Реклама)" 
            subtitle="Elite Service Package"
            icon={Sparkles}
            colorClass="text-purple-600"
            onClick={() => onNavigate('design')}
          />
        </div>
      </div>
    </div>
  );
};