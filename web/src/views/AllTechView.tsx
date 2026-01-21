
import React from 'react';
import { ChevronLeft, Camera, PenTool, FileText, Video, GraduationCap, ArrowRight } from 'lucide-react';
import { ViewState, AppConfig } from '../types';

interface AllTechViewProps {
  config: AppConfig;
  onNavigate: (view: ViewState) => void;
  onBack: () => void;
}

export const AllTechView: React.FC<AllTechViewProps> = ({ config, onNavigate, onBack }) => {
  
  const techs = [
    { id: 'photo', label: 'Фото Lab', desc: 'Генерация изображений', icon: Camera, color: 'text-blue-600', enabled: config.photo },
    { id: 'design', label: 'Дизайн Студия', desc: 'Маркетинг и брендинг', icon: PenTool, color: 'text-pink-600', enabled: config.design },
    { id: 'contract', label: 'Юрист AI', desc: 'Договоры и документы', icon: FileText, color: 'text-emerald-600', enabled: config.contract },
    { id: 'video', label: 'Видео Мейкер', desc: 'Reels и сценарии', icon: Video, color: 'text-purple-600', enabled: config.video },
    { id: 'courses', label: 'Академия', desc: 'База знаний X5', icon: GraduationCap, color: 'text-orange-600', enabled: config.courses },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100">
          <ChevronLeft className="text-slate-900" size={22} />
        </button>
        <div>
           <h2 className="text-xl font-extrabold text-slate-900 leading-none">Технологии</h2>
           <p className="text-xs text-slate-500 font-medium mt-0.5">Полный список</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {techs.filter(t => t.enabled).map((tech) => (
           <button 
             key={tech.id} 
             onClick={() => onNavigate(tech.id as ViewState)}
             className="glass-card p-5 rounded-[28px] flex items-center gap-4 text-left group active:scale-[0.98] transition-all hover:bg-white border border-slate-100"
           >
             <div className="w-14 h-14 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <tech.icon size={26} className={tech.color} />
             </div>
             <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{tech.label}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{tech.desc}</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <ArrowRight size={16} />
             </div>
           </button>
        ))}
      </div>
    </div>
  );
};
