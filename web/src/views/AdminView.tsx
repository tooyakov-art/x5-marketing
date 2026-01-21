
import React, { useState } from 'react';
import { ChevronLeft, Check, Save } from 'lucide-react';
import { AppConfig } from '../types';

interface AdminViewProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ config, onUpdateConfig, onBack }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  const toggleModule = (key: keyof AppConfig) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    onUpdateConfig(localConfig);
    onBack();
  };

  const items: { key: keyof AppConfig; label: string }[] = [
    { key: 'photo', label: 'Фото Лаборатория' },
    { key: 'design', label: 'Дизайн Студия' },
    { key: 'contract', label: 'Юридический ИИ' },
    { key: 'video', label: 'Видео Креативы' },
    { key: 'courses', label: 'Академия X5' }
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="w-10 h-10 glass-card rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-100">
          <ChevronLeft className="text-slate-900" size={22} />
        </button>
        <div>
           <h2 className="text-xl font-extrabold text-slate-900 leading-none">Admin Panel</h2>
           <p className="text-xs text-slate-500 font-medium mt-0.5">Configuration</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 rounded-[32px] space-y-4 bg-white/60">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Доступные технологии</h3>
           {items.map((item) => (
             <div key={item.key} onClick={() => toggleModule(item.key)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                <span className="font-bold text-slate-800">{item.label}</span>
                <div className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${localConfig[item.key] ? 'bg-slate-900' : 'bg-slate-200'}`}>
                   <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${localConfig[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
             </div>
           ))}
        </div>

        <button 
          onClick={handleSave} 
          className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Save size={18} />
          <span>Сохранить изменения</span>
        </button>
      </div>
    </div>
  );
};
