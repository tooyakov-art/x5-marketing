
import React from 'react';
import { ChevronLeft, Lock, CheckCircle } from 'lucide-react';

interface ApiManagerViewProps {
  onBack: () => void;
}

export const ApiManagerView: React.FC<ApiManagerViewProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full animate-fade-in bg-[#f2f4f6] relative z-50">
      
      {/* HEADER */}
      <div className="pt-16 pb-6 px-6 bg-white shadow-sm shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-slate-200">
                <ChevronLeft size={22} className="text-slate-800" />
            </button>
            <div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-none">System Core</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Status Check</p>
            </div>
          </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-xl shadow-green-500/20">
              <CheckCircle size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">AI System Online</h3>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
              Connection to Gemini AI and Veo Video Engines is active and secured via Environment Variables.
          </p>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 w-full max-w-xs text-left space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Text Model</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">Gemini 2.5</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Image Model</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">Imagen 3</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Video Model</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">Veo</span>
              </div>
              <div className="h-px bg-slate-100 my-2"></div>
              <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                  <span className="text-xs font-bold text-green-600 uppercase flex items-center gap-1"><Lock size={10}/> Secure</span>
              </div>
          </div>
      </div>
    </div>
  );
};
