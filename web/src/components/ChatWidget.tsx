
import React, { useRef, useEffect } from 'react';
import { Send, X, Paperclip, Loader2, Sparkles, MessageSquare, ArrowRight, ChevronDown } from 'lucide-react';
import { ChatMessage, TechSuggestion } from '../types';

interface ChatWidgetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onNavigate: (view: any) => void;
  attachedFiles: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  filePreviews: string[];
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  setIsOpen,
  messages,
  isTyping,
  onSendMessage,
  onNavigate,
  attachedFiles,
  onFileSelect,
  onRemoveFile,
  filePreviews
}) => {
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSubmit = () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    onSendMessage(input);
    setInput('');
  };

  const PlanWidget = ({ suggestions }: { suggestions: TechSuggestion[] }) => (
    <div className="w-full mt-2 animate-slide-up">
        <div className="glass-card p-3 rounded-[20px] bg-white/90 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <Sparkles size={14} className="text-purple-600" />
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">План действий</span>
            </div>
            <div className="space-y-2">
               {suggestions.map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => {
                        onNavigate(s.view);
                        if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className="w-full p-2.5 rounded-[16px] flex items-center gap-3 text-left bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all active:scale-[0.98] group"
                  >
                     <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">{s.title}</h3>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5 leading-snug truncate">{s.reason}</p>
                     </div>
                     <ArrowRight size={12} className="text-slate-300 group-hover:text-purple-500" />
                  </button>
               ))}
            </div>
        </div>
    </div>
  );

  return (
    <>
      {/* Dimmed Background Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-Up Sheet / Modal */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}`}
        style={{ height: '85vh', maxHeight: '700px' }}
      >
        <div className="w-full h-full max-w-lg mx-auto bg-[#f2f4f6] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden border-t border-white/50 relative">
            
            {/* Grabber */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300 rounded-full z-20" onClick={() => setIsOpen(false)} />

            {/* Header */}
            <div className="px-6 py-5 bg-white/60 backdrop-blur-md border-b border-white/50 flex justify-between items-center shrink-0 pt-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg">
                        <span className="font-bold text-sm">X5</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">AI Ментор</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-medium text-slate-500">Готов к работе</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                    <ChevronDown size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/30 to-transparent">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                        <MessageSquare size={32} className="text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-500">Чат с Ментором</p>
                        <p className="text-xs text-slate-400 mt-1">Задайте вопрос или попросите совета.</p>
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                        <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            {/* Media */}
                            {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-1 mb-1">
                                    {msg.mediaUrls.map((url, idx) => (
                                        <img key={idx} src={url} className="w-24 h-24 object-cover rounded-[14px] border border-white" alt="upload" />
                                    ))}
                                </div>
                            )}

                            {/* Text */}
                            {msg.content && (
                                <div className={`px-4 py-3 rounded-[20px] text-[14px] font-medium leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-br-none' 
                                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                                }`}>
                                    {msg.content}
                                </div>
                            )}

                            {/* Widgets */}
                            {msg.type === 'plan' && msg.planData && <PlanWidget suggestions={msg.planData} />}
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white px-4 py-3 rounded-[20px] rounded-bl-none shadow-sm border border-slate-100 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100 pb-8">
                {/* File Previews */}
                {attachedFiles.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1 px-1">
                        {filePreviews.map((src, idx) => (
                            <div key={idx} className="relative w-12 h-12 shrink-0 group">
                                <img src={src} className="w-full h-full object-cover rounded-[10px] border border-slate-200" alt="preview" />
                                <button onClick={() => onRemoveFile(idx)} className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md"><X size={8} /></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-[24px] border border-slate-200 focus-within:bg-white focus-within:border-purple-200 transition-colors shadow-inner">
                    <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors shrink-0">
                        <Paperclip size={20} />
                        <input type="file" multiple ref={fileInputRef} className="hidden" onChange={onFileSelect} />
                    </button>
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                        placeholder="Сообщение..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 max-h-24 text-sm font-medium text-slate-900 placeholder-slate-400"
                        rows={1}
                    />
                    <button 
                        onClick={handleSubmit}
                        disabled={(!input.trim() && attachedFiles.length === 0) || isTyping}
                        className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 shrink-0"
                    >
                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};
