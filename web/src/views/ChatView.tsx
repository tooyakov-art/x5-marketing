
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Paperclip, Loader2, MessageSquare, X, ChevronDown, CheckCheck, Star, Calendar, User as UserIcon, Mic, MicOff, Image, Play, Pause, Camera, Sparkles } from 'lucide-react';
import { ChatMessage, ViewProps, Specialist } from '../types';
import { db, storage } from '../firebase';
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
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Media picker
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Derive Chat ID
  const chatId = user && specialist
    ? [user.id, specialist.id].sort().join('_')
    : null;

  // Mark messages as read when opening chat
  useEffect(() => {
      if (!chatId || !user) return;
      db.collection('chats').doc(chatId).update({
          [`unread_${user.id}`]: 0
      }).catch(() => {});
  }, [chatId, user]);

  // Real-time listener
  useEffect(() => {
      if (!chatId) return;

      const unsubscribe = db.collection('chats')
          .doc(chatId)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .limit(100)
          .onSnapshot(snapshot => {
              const msgs = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
              })) as ChatMessage[];
              setMessages(msgs);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Load specialist's full profile from Firestore
  const handleOpenProfile = async () => {
    if (!specialist) return;
    setShowProfile(true);
    try {
      const userDoc = await db.collection('users').doc(specialist.id).get();
      const specDoc = await db.collection('specialists').doc(specialist.id).get();
      setProfileData({
        ...(userDoc.exists ? userDoc.data() : {}),
        ...(specDoc.exists ? specDoc.data() : {}),
      });
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  };

  // Upload file to Firebase Storage
  const uploadToStorage = async (file: Blob, path: string): Promise<string> => {
    const ref = storage.ref(path);
    const task = ref.put(file);

    return new Promise((resolve, reject) => {
      task.on('state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (error) => reject(error),
        async () => {
          const url = await task.snapshot.ref.getDownloadURL();
          resolve(url);
        }
      );
    });
  };

  // Send a message (text, media, or voice)
  const sendMessage = async (msgData: { type: string; content?: string; mediaUrl?: string; mediaMime?: string }) => {
    if (!chatId || !user) return;

    try {
      await db.collection('chats').doc(chatId).set({
        participants: [user.id, specialist?.id],
        lastMessage: msgData.type === 'text' ? (msgData.content || '') :
                     msgData.type === 'image' ? '📷 Фото' :
                     msgData.type === 'video' ? '🎬 Видео' : '🎤 Голосовое',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        [`unread_${specialist?.id}`]: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      await db.collection('chats').doc(chatId).collection('messages').add({
        ...msgData,
        role: 'user',
        timestamp: Date.now(),
        senderId: user.id
      });
    } catch (e) {
      console.error("Failed to send", e);
      showToast("Ошибка отправки", "error");
    }
  };

  // Handle text message submit
  const handleSubmit = async () => {
    if (!input.trim() || !chatId || !user) return;

    setSending(true);
    const text = input;
    setInput('');

    try {
      await sendMessage({ type: 'text', content: text });
    } catch (e) {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  // Handle media file selection (photos/videos from gallery)
  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !chatId || !user) return;
    setShowMediaPicker(false);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isImage && !isVideo) continue;

        const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
        const path = `chats/${chatId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const url = await uploadToStorage(file, path);

        await sendMessage({
          type: isVideo ? 'video' : 'image',
          mediaUrl: url,
          mediaMime: file.type
        });
      }
    } catch (e) {
      console.error("Upload error", e);
      showToast("Ошибка загрузки файла", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) return; // Too short

        setUploading(true);
        try {
          const path = `chats/${chatId}/${Date.now()}_voice.webm`;
          const url = await uploadToStorage(blob, path);
          await sendMessage({
            type: 'audio',
            mediaUrl: url,
            mediaMime: 'audio/webm',
            content: `${recordingTime}s`
          });
        } catch (e) {
          showToast("Ошибка отправки голосового", "error");
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e) {
      showToast("Нет доступа к микрофону", "error");
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  // Cancel voice recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  // Play/pause audio message
  const toggleAudio = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingAudioId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingAudioId(msgId);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
          <div className="flex items-center gap-3 cursor-pointer active:opacity-70 transition-opacity" onClick={handleOpenProfile}>
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
              const msgType = (msg as any).type || 'text';
              const mediaUrl = (msg as any).mediaUrl;

              return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>

                        {/* Image message */}
                        {msgType === 'image' && mediaUrl && (
                          <div className={`rounded-[20px] overflow-hidden shadow-sm ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                            <img src={mediaUrl} className="max-w-[260px] max-h-[300px] object-cover" alt="photo" />
                            <div className={`text-[9px] px-3 py-1 flex items-center justify-end gap-1 ${isMe ? 'bg-blue-600 text-blue-100' : 'bg-white text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {isMe && <CheckCheck size={10} className="opacity-80" />}
                            </div>
                          </div>
                        )}

                        {/* Video message */}
                        {msgType === 'video' && mediaUrl && (
                          <div className={`rounded-[20px] overflow-hidden shadow-sm ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                            <video src={mediaUrl} controls className="max-w-[260px] max-h-[300px] rounded-t-[20px]" playsInline preload="metadata" />
                            <div className={`text-[9px] px-3 py-1 flex items-center justify-end gap-1 ${isMe ? 'bg-blue-600 text-blue-100' : 'bg-white text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {isMe && <CheckCheck size={10} className="opacity-80" />}
                            </div>
                          </div>
                        )}

                        {/* Voice message */}
                        {msgType === 'audio' && mediaUrl && (
                          <div className={`px-4 py-3 rounded-[20px] shadow-sm flex items-center gap-3 min-w-[180px] ${
                            isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                          }`}>
                            <button
                              onClick={() => toggleAudio(msg.id, mediaUrl)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                isMe ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {playingAudioId === msg.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                            </button>
                            <div className="flex-1">
                              <div className={`h-1 rounded-full ${isMe ? 'bg-white/30' : 'bg-slate-200'}`}>
                                <div className={`h-full rounded-full w-0 ${isMe ? 'bg-white' : 'bg-blue-500'} ${playingAudioId === msg.id ? 'animate-pulse w-full' : ''}`} style={{ transition: 'width 0.3s' }} />
                              </div>
                              <div className={`text-[9px] mt-1 flex items-center justify-between ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                <span>{msg.content || '0:00'}</span>
                                <span className="flex items-center gap-1">
                                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {isMe && <CheckCheck size={10} className="opacity-80" />}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Legacy media support */}
                        {msg.mediaUrls && msg.mediaUrls.length > 0 && msgType === 'text' && (
                            <div className="grid grid-cols-2 gap-1 mb-1">
                                {msg.mediaUrls.map((url, idx) => (
                                    <img key={idx} src={url} className="w-24 h-24 object-cover rounded-[14px] border border-white shadow-sm" alt="upload" />
                                ))}
                            </div>
                        )}

                        {/* Text Bubble */}
                        {msgType === 'text' && msg.content && (
                            <div className={`px-4 py-3 rounded-[20px] text-[14px] leading-relaxed shadow-sm relative group ${
                                isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                            }`}>
                                {msg.content}
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

          {/* Upload progress */}
          {uploading && (
            <div className="flex justify-center">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs font-bold text-slate-600">Загрузка {uploadProgress}%</span>
              </div>
            </div>
          )}
      </div>

      {/* Media Picker Sheet */}
      {showMediaPicker && (
        <div className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-40 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Отправить</span>
            <button onClick={() => setShowMediaPicker(false)} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
              <X size={12} className="text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { mediaInputRef.current?.click(); }}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Image size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Галерея</p>
                <p className="text-[10px] text-slate-500">Фото или видео</p>
              </div>
            </button>
            <button
              onClick={() => { setShowMediaPicker(false); if (onNavigate) onNavigate('photo'); }}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles size={18} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">AI Фото</p>
                <p className="text-[10px] text-slate-500">Сгенерировать</p>
              </div>
            </button>
          </div>
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleMediaSelect}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-30">

          {/* Voice Recording UI */}
          {isRecording ? (
            <div className="flex items-center gap-3 bg-red-50 p-3 rounded-[26px] border border-red-200">
              <button onClick={cancelRecording} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 active:scale-95">
                <X size={18} className="text-slate-600" />
              </button>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-red-600">{formatTime(recordingTime)}</span>
                <span className="text-xs text-red-400">Запись...</span>
              </div>
              <button onClick={stopRecording} className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0">
                <Send size={18} className="text-white ml-0.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-[26px] border border-slate-200 focus-within:bg-white focus-within:border-blue-300 transition-colors shadow-inner">
                <button
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                >
                    <Camera size={20} />
                </button>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                    placeholder="Сообщение..."
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 max-h-32 text-sm font-medium text-slate-900 placeholder-slate-400"
                    rows={1}
                />
                {input.trim() ? (
                  <button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50 shrink-0"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95 transition-transform shrink-0 hover:bg-red-100 hover:text-red-500"
                  >
                    <Mic size={18} />
                  </button>
                )}
            </div>
          )}
      </div>

      {/* Profile Bottom Sheet */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowProfile(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-[28px] max-h-[75vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            <div className="px-6 pb-8">
              <div className="flex flex-col items-center mb-5">
                <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden shadow-lg mb-3 border-2 border-white">
                  {specialist.avatar ? (
                    <img src={specialist.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-300 flex items-center justify-center">
                      <UserIcon size={32} className="text-white" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900">{specialist.name}</h2>
                {profileData?.nickname && (
                  <span className="text-xs font-bold text-slate-400 mt-0.5">@{profileData.nickname}</span>
                )}
                <span className="text-sm text-slate-500 font-medium mt-1">{specialist.role}</span>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-slate-800">{specialist.rating}</span>
                  </div>
                  {specialist.online && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs font-bold text-green-600">Онлайн</span>
                    </div>
                  )}
                  <span className="text-sm font-bold text-emerald-600">{specialist.price}</span>
                </div>
              </div>

              {profileData?.bio && (
                <div className="mb-4 bg-slate-50 p-4 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">О себе</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{profileData.bio}</p>
                </div>
              )}

              {profileData?.description && !profileData?.bio && (
                <div className="mb-4 bg-slate-50 p-4 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Описание</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{profileData.description}</p>
                </div>
              )}

              {profileData?.services && profileData.services.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Услуги</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.services.map((svc: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{svc}</span>
                    ))}
                  </div>
                </div>
              )}

              {specialist.skills && specialist.skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Навыки</h4>
                  <div className="flex flex-wrap gap-2">
                    {specialist.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {profileData?.createdAt && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-bold">
                    На платформе с {new Date(profileData.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
