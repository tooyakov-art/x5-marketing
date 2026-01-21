import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassButtonProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  onClick: () => void;
  colorClass?: string;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ icon: Icon, title, subtitle, onClick, colorClass = "text-slate-800", className = "" }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full glass-card p-5 rounded-[24px] flex items-center justify-between group mb-4 text-left hover:bg-white/60 transition-colors ${className}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${colorClass} bg-white shadow-sm border border-slate-50`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
        )}
        <div>
          <h3 className="text-[17px] font-bold tracking-tight text-slate-900 leading-snug">{title}</h3>
          {subtitle && <p className="text-[13px] text-slate-500 font-medium leading-snug opacity-80">{subtitle}</p>}
        </div>
      </div>
      <div className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const GlassInput: React.FC<InputProps> = ({ label, className, ...props }) => (
  <div className="mb-5 group">
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-4 transition-colors group-focus-within:text-blue-500">
      {label}
    </label>
    <input 
      className={`w-full glass-input px-5 py-4 rounded-[20px] text-[15px] font-medium text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 transition-all ${className}`}
      {...props} 
    />
  </div>
);

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-600 animate-spin"></div>
        <div className="absolute inset-4 rounded-full bg-white/50 backdrop-blur-md"></div>
    </div>
    <p className="text-slate-400 font-bold text-xs mt-6 uppercase tracking-widest animate-pulse">X5 Intelligence Processing</p>
  </div>
);