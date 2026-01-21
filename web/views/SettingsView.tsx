
import React from 'react';
import { Bell, Globe, HelpCircle, LogOut, Moon, Shield } from 'lucide-react';
import { GlassButton } from '../components/GlassComponents';

export const SettingsView: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-fade-in px-6 pt-8 pb-24 overflow-y-auto">
      
      <div className="mb-8 pl-2">
        <h2 className="text-2xl font-bold text-slate-800">Настройки</h2>
        <p className="text-sm text-slate-500">Управление приложением</p>
      </div>

      <div className="space-y-6">
        
        {/* Section 1 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Основные</h3>
          
          <GlassButton 
            title="Уведомления" 
            icon={Bell}
            colorClass="text-orange-500"
            onClick={() => {}}
          />
           <GlassButton 
            title="Язык / Language" 
            subtitle="Русский"
            icon={Globe}
            colorClass="text-blue-500"
            onClick={() => {}}
          />
           <GlassButton 
            title="Тема оформления" 
            subtitle="Светлая (Liquid)"
            icon={Moon}
            colorClass="text-purple-500"
            onClick={() => {}}
          />
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Поддержка</h3>
          
          <GlassButton 
            title="Помощь и FAQ" 
            icon={HelpCircle}
            colorClass="text-emerald-500"
            onClick={() => {}}
          />
           <GlassButton 
            title="Конфиденциальность" 
            icon={Shield}
            colorClass="text-slate-500"
            onClick={() => {}}
          />
        </div>

        {/* Logout */}
        <div className="pt-4">
          <button className="w-full py-4 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-2xl transition-colors flex items-center justify-center gap-2">
            <LogOut size={18} />
            <span>Выйти из аккаунта</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4">
            Версия 1.1 (Build 2)
          </p>
        </div>

      </div>
    </div>
  );
};