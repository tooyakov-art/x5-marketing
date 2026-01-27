
import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Loader2, MessageSquare, ArrowRight, X, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { ChatMessage, ViewProps, Specialist } from '../types';
import { t } from '../services/translations';
import { db } from '../firebase';
import { useToast } from '../components/Toast';
import firebase from 'firebase/compat/app';

interface ChatViewProps extends ViewProps {
    specialist?: Specialist;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onNavigate,
  attachedFiles = [],
  onFileSelect,
  onRemoveFile,
  filePreviews = [],
  onBack,
  language = 'ru',
  specialist,
  user
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive Chat ID
  const chatId = user && specialist 
    ? [user.id, specialist.id].sort().join('_') 
    : null;

  // Mark messages as read when opening chat
  useEffect(() => {
      if (!chatId || !user) return;
      db.collection('chats').doc(chatId).update({
          [`unread_${user.id}`]: 0
      }).catch(() => {}); // ignore if chat doesn't exist yet
  }, [chatId, user]);

  // Real-time listener
  useEffect(() => {
      if (!chatId) return;

      const unsubscribe = db.collection('chats')
          .doc(chatId)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .limit(50)
          .onSnapshot(snapshot => {
              const msgs = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
              })) as ChatMessage[];
              setMessages(msgs);
              // Mark as read on new messages too
              if (user) {
                  db.collection('chats').doc(chatId).update({
                      [`unread_${user.id}`]: 0
                  }).catch(() => {});
              }
          });

      return () => unsubscribe();
  }, [chatId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || !chatId || !user) return;
    
    setSending(true);
    const text = input;
    setInput('');

    try {
        // FIRST: Create/update chat document (must exist before adding messages)
        await db.collection('chats').doc(chatId).set({
            participants: [user.id, specialist?.id],
            lastMessage: text || 'File',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            [`unread_${specialist?.id}`]: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });

        // THEN: Add message to subcollection
        const newMessage = {
            role: 'user',
            type: 'text',
            content: text,
            timestamp: Date.now(),
            senderId: user.id
        };
        await db.collection('chats').doc(chatId).collection('messages').add(newMessage);

    } catch (e) {
        console.error("Failed to send", e);
        showToast("Ошибка отправки: " + (e as any)?.message, "error");
        setInput(text); // Restore text
    } finally {
        setSending(false);
    }
  };

  // If no specialist selected (should not happen if navigated correctly), show empty state or fallback
  if (!specialist) {
      return (
          <div className="flex flex-col h-full items-center justify-center bg-[#f2f4f6]">
              <p className="text-slate-400 font-bold">Чат не найден</p>
              <button onClick={onBack} className="mt-4 text-blue-500 font-bold">Назад</button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in bg-[#f2f4f6]">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between shrink-0 pt-12 shadow-sm z-20">
          <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shadow-md relative border border-slate-200">
                    {specialist.avatar ? (
                        <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-300 flex items-center justify-center text-white font-bold">{specialist.name[0]}</div>
                    )}
                    {specialist.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{specialist.name}</h3>
                    <p className="text-[10px] font-medium text-slate-500">{specialist.role}</p>
                </div>
          </div>
          {onBack && <button onClick={onBack} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-200"><ChevronDown size={16} className="text-slate-600" /></button>}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 no-scrollbar bg-[#f2f4f6]">
          {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <MessageSquare size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Начните диалог</p>
                  <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
                      Напишите приветствие, чтобы обсудить детали проекта.
                  </p>
              </div>
          )}
          
          {messages.map((msg) => {
              const isMe = (msg as any).senderId === user?.id;
              return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Media */}
                        {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mb-1">
                                {msg.mediaUrls.map((url, idx) => (
                                    <img key={idx} src={url} className="w-24 h-24 object-cover rounded-[14px] border border-white shadow-sm" alt="upload" />
                                ))}
                            </div>
                        )}

                        {/* Text Bubble */}
                        {msg.content && (
                            <div className={`px-4 py-3 rounded-[20px] text-[14px] leading-relaxed shadow-sm relative group ${
                                isMe
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                            }`}>
                                {msg.content}
                                
                                {/* Timestamp & Status */}
                                <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {isMe && <CheckCheck size={10} className="opacity-80" />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
              );
          })}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-4 bg-white border-t border-slate-100 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-30">
          {/* File Previews */}
          {attachedFiles.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 px-1">
                  {filePreviews.map((src, idx) => (
                      <div key={idx} className="relative w-14 h-14 shrink-0 group">
                          <img src={src} className="w-full h-full object-cover rounded-[12px] border border-slate-200" alt="preview" />
                          <button onClick={() => onRemoveFile && onRemoveFile(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md"><X size={10} /></button>
                      </div>
                  ))}
              </div>
          )}

          <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-[26px] border border-slate-200 focus-within:bg-white focus-within:border-blue-300 transition-colors shadow-inner">
              <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0">
                  <Paperclip size={20} />
                  <input type="file" multiple ref={fileInputRef} className="hidden" onChange={onFileSelect} />
              </button>
              <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                  placeholder="Сообщение..."
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 max-h-32 text-sm font-medium text-slate-900 placeholder-slate-400"
                  rows={1}
              />
              <button 
                  onClick={handleSubmit}
                  disabled={(!input.trim() && attachedFiles.length === 0) || sending}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 shrink-0"
              >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </button>
          </div>
      </div>
    </div>
  );
};
