
import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface GlassButtonProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  onClick: () => void;
  colorClass?: string;
  className?: string;
  isListItem?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ icon: Icon, title, subtitle, onClick, colorClass = "text-slate-900", className = "", isListItem = false }) => {
  
  if (isListItem) {
    return (
      <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 group hover:bg-slate-100 transition-colors ${className}`}
      >
         <div className="flex items-center gap-4">
          {Icon && (
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${colorClass} bg-slate-100`}>
              <Icon size={18} />
            </div>
          )}
          <div className="text-left">
            <h3 className="text-[15px] font-medium text-slate-900 leading-snug">{title}</h3>
            {subtitle && <p className="text-[12px] text-slate-500 font-medium leading-snug opacity-70">{subtitle}</p>}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
      </button>
    )
  }

  return (
    <button 
      onClick={onClick}
      className={`w-full glass-card p-5 rounded-[32px] flex items-center justify-between group mb-3 text-left relative overflow-hidden ${className}`}
    >
      {/* Gradient shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />

      <div className="flex items-center gap-5 relative z-10">
        {Icon && (
          <div className={`w-14 h-14 flex items-center justify-center rounded-[20px] bg-white/50 backdrop-blur-md shadow-sm border border-white/60 ${colorClass}`}>
            <Icon size={26} strokeWidth={2.5} />
          </div>
        )}
        <div>
          <h3 className="text-[17px] font-bold tracking-tight text-slate-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-[13px] text-slate-500 font-medium mt-0.5 opacity-80">{subtitle}</p>}
        </div>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-white/0 flex items-center justify-center text-slate-300 group-hover:text-slate-600 group-hover:bg-white/50 transition-all">
         <ChevronRight size={18} strokeWidth={3} />
      </div>
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const GlassInput: React.FC<InputProps> = ({ label, className, ...props }) => (
  <div className="mb-4 group w-full">
    {label && <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-4 transition-colors group-focus-within:text-slate-900">
      {label}
    </label>}
    <input 
      className={`w-full glass-input px-5 py-4 rounded-[24px] text-[16px] font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all ${className}`}
      {...props} 
    />
  </div>
);

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-[3px] border-t-transparent border-blue-600 animate-spin" style={{animationDuration: '0.8s'}}></div>
        <div className="absolute inset-2 rounded-full bg-white/40 backdrop-blur-xl"></div>
    </div>
  </div>
);
