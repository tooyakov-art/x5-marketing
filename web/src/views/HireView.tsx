
import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Briefcase, Zap, PenTool, Smartphone, Code, Megaphone, FileText, Layout, ChevronLeft, Star, MessageCircle, Plus, CheckCircle2, User as UserIcon, Edit3, Trash2, Sparkles, ArrowRight, Users } from 'lucide-react';
import { ViewProps, Specialist } from '../types';
import { t } from '../services/translations';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import { motion, AnimatePresence } from 'framer-motion';

interface SpecialistData extends Specialist {
    categoryId: string;
    description?: string;
}

export const HireView: React.FC<ViewProps> = ({ onNavigate, user, language = 'ru' }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [specialists, setSpecialists] = useState<SpecialistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
      role: '',
      price: '',
      categoryId: 'marketing',
      description: ''
  });

  // Fetch Real Specialists
  useEffect(() => {
      const unsubscribe = db.collection('specialists').onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialistData));
          setSpecialists(data);
          setLoading(false);
      });
      return () => unsubscribe();
  }, []);

  const categories = [
      { id: 'marketing', title: t('hire_cat_marketing', language), icon: Megaphone, gradient: 'from-blue-500 to-indigo-600', emoji: '📣' },
      { id: 'design', title: t('hire_cat_design', language), icon: PenTool, gradient: 'from-pink-500 to-rose-600', emoji: '🎨' },
      { id: 'smm', title: 'SMM', icon: Smartphone, gradient: 'from-orange-500 to-amber-500', emoji: '📱' },
      { id: 'dev', title: language === 'ru' ? 'Разработка' : 'Development', icon: Code, gradient: 'from-slate-600 to-slate-800', emoji: '💻' },
      { id: 'copy', title: language === 'ru' ? 'Копирайтинг' : 'Copywriting', icon: FileText, gradient: 'from-emerald-500 to-teal-600', emoji: '✍️' },
      { id: 'video', title: language === 'ru' ? 'Видео' : 'Video', icon: Layout, gradient: 'from-purple-500 to-violet-600', emoji: '🎬' }
  ];

  // Find my profile
  const myProfile = user ? specialists.find(s => s.id === user.id) : null;

  // Filter specialists by search
  const filteredSpecialists = specialists.filter(s => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) || s.role.toLowerCase().includes(query);
  });

  const handleChat = (spec: Specialist) => {
      if (onNavigate) {
          onNavigate('chat', spec);
      }
  };

  const handleEditProfile = () => {
      if (myProfile) {
          setFormData({
              role: myProfile.role,
              price: myProfile.price.replace(/[^0-9]/g, ''),
              categoryId: myProfile.categoryId || 'marketing',
              description: myProfile.description || ''
          });
          setIsRegistering(true);
      }
  };

  const handleDeleteProfile = async () => {
      if (!user) return;
      if (confirm(language === 'ru' ? 'Удалить ваше объявление?' : 'Delete your listing?')) {
          try {
              await db.collection('specialists').doc(user.id).delete();
          } catch (e) {
              alert(language === 'ru' ? 'Ошибка удаления' : 'Delete error');
          }
      }
  };

  const handlePublishProfile = async () => {
      if (!user) return;
      if (!formData.role || !formData.price) {
          alert(language === 'ru' ? "Заполните роль и цену" : "Fill in role and price");
          return;
      }

      const newSpecialist = {
          userId: user.id,
          name: user.name,
          avatar: user.avatar || '',
          role: formData.role,
          price: formData.price + ' ₸/' + (language === 'ru' ? 'час' : 'hr'),
          categoryId: formData.categoryId,
          rating: 5.0,
          online: true,
          skills: ['Pro'],
          description: formData.description,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
          await db.collection('specialists').doc(user.id).set(newSpecialist);
          setIsRegistering(false);
          setSelectedCategory(formData.categoryId);
      } catch (e) {
          console.error("Error publishing profile:", e);
          alert(language === 'ru' ? "Ошибка сохранения" : "Save error");
      }
  };

  const handleSupportChat = () => {
      if (onNavigate) {
          onNavigate('chat', {
              id: 'support',
              name: 'X5 HR Manager',
              role: language === 'ru' ? 'Подбор персонала' : 'HR Manager',
              avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80',
              rating: 5.0,
              price: '',
              skills: [],
              online: true
          });
      }
  }

  // --- REGISTRATION FORM ---
  if (isRegistering) {
      return (
          <div className="flex flex-col h-full animate-fade-in bg-[#f8f9fb]">
              {/* Header */}
              <div className="px-6 pt-16 pb-4 bg-white shadow-sm shrink-0">
                  <div className="flex items-center gap-4">
                      <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsRegistering(false)}
                          className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
                      >
                          <ChevronLeft size={22} className="text-slate-900"/>
                      </motion.button>
                      <h2 className="text-xl font-black text-slate-900">
                          {myProfile ? (language === 'ru' ? 'Редактирование' : 'Edit Profile') : (language === 'ru' ? 'Создание профиля' : 'Create Profile')}
                      </h2>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 space-y-5"
                  >
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <UserIcon className="m-4 text-slate-400"/>}
                          </div>
                          <div>
                              <p className="text-base font-bold text-slate-900">{user?.name}</p>
                              <p className="text-xs text-slate-500">{language === 'ru' ? 'Ваш профиль' : 'Your profile'}</p>
                          </div>
                      </div>

                      {/* Category Selection */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              {language === 'ru' ? 'Категория' : 'Category'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                              {categories.map(cat => (
                                  <motion.button
                                    key={cat.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFormData({...formData, categoryId: cat.id})}
                                    className={`p-3 rounded-xl text-xs font-bold text-left transition-all flex items-center gap-2 ${
                                        formData.categoryId === cat.id
                                            ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                                            : 'bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                      <span>{cat.emoji}</span>
                                      <span>{cat.title}</span>
                                  </motion.button>
                              ))}
                          </div>
                      </div>

                      {/* Role */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              {language === 'ru' ? 'Специальность' : 'Specialty'}
                          </label>
                          <input
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}
                            placeholder={language === 'ru' ? "Например: Графический Дизайнер" : "e.g. Graphic Designer"}
                            className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 ring-blue-200 transition-all"
                          />
                      </div>

                      {/* Price */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                              {language === 'ru' ? 'Цена за час (₸)' : 'Hourly rate (₸)'}
                          </label>
                          <input
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: e.target.value})}
                            placeholder="5000"
                            type="number"
                            className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 ring-blue-200 transition-all"
                          />
                      </div>

                      {/* Publish Button */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePublishProfile}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                      >
                          <CheckCircle2 size={20} />
                          <span>{myProfile ? (language === 'ru' ? 'Сохранить' : 'Save') : (language === 'ru' ? 'Опубликовать' : 'Publish')}</span>
                      </motion.button>

                      {myProfile && (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { handleDeleteProfile(); setIsRegistering(false); }}
                            className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2"
                          >
                              <Trash2 size={18} />
                              <span>{language === 'ru' ? 'Удалить' : 'Delete'}</span>
                          </motion.button>
                      )}
                  </motion.div>
              </div>
          </div>
      )
  }

  // --- SPECIALISTS LIST VIEW ---
  if (selectedCategory) {
      const categoryData = categories.find(c => c.id === selectedCategory);
      const categorySpecialists = filteredSpecialists.filter(s => s.categoryId === selectedCategory);

      return (
          <div className="flex flex-col h-full animate-fade-in bg-[#f8f9fb]">
              {/* Header */}
              <div className="px-6 pt-16 pb-4 bg-white shadow-sm shrink-0">
                  <div className="flex items-center gap-4 mb-4">
                      <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedCategory(null)}
                          className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
                      >
                          <ChevronLeft size={22} className="text-slate-900"/>
                      </motion.button>
                      <div className="flex-1">
                          <h2 className="text-xl font-black text-slate-900">{categoryData?.title}</h2>
                          <p className="text-xs text-slate-500">{categorySpecialists.length} {language === 'ru' ? 'специалистов' : 'specialists'}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryData?.gradient} flex items-center justify-center shadow-lg`}>
                          <span className="text-xl">{categoryData?.emoji}</span>
                      </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder={t('hire_search', language)}
                          className="w-full bg-slate-50 h-12 pl-12 pr-4 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 ring-blue-200"
                      />
                  </div>
              </div>

              {/* Specialists List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 pb-32">
                  {categorySpecialists.length === 0 ? (
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-20"
                      >
                          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Users size={32} className="text-slate-300" />
                          </div>
                          <p className="text-sm font-bold text-slate-500 mb-2">
                              {language === 'ru' ? 'Пока пусто' : 'Empty yet'}
                          </p>
                          <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setSelectedCategory(null); setIsRegistering(true); }}
                              className="text-blue-500 text-xs font-bold"
                          >
                              {language === 'ru' ? 'Станьте первым!' : 'Be the first!'}
                          </motion.button>
                      </motion.div>
                  ) : (
                      <div className="space-y-3">
                          {categorySpecialists.map((spec, idx) => (
                              <motion.div
                                  key={spec.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
                              >
                                  <div className="relative">
                                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden">
                                          {spec.avatar ? <img src={spec.avatar} className="w-full h-full object-cover" alt={spec.name} /> : <UserIcon className="m-3 text-slate-400" />}
                                      </div>
                                      {spec.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                          <h3 className="font-bold text-slate-900 text-sm truncate">{spec.name}</h3>
                                          <div className="flex items-center gap-0.5 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] text-amber-700 font-bold">
                                              <Star size={10} className="fill-amber-500 text-amber-500" />
                                              {spec.rating}
                                          </div>
                                      </div>
                                      <p className="text-xs text-slate-500 truncate">{spec.role}</p>
                                      <p className="text-xs font-bold text-emerald-600 mt-1">{spec.price}</p>
                                  </div>

                                  {spec.id !== user?.id && (
                                      <motion.button
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => handleChat(spec)}
                                          className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20"
                                      >
                                          <MessageCircle size={18} />
                                      </motion.button>
                                  )}
                              </motion.div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- MAIN VIEW ---
  return (
    <div className="flex flex-col h-full animate-fade-in bg-[#f8f9fb]">
        {/* Header */}
        <div className="px-6 pt-16 pb-4 bg-white shadow-sm shrink-0">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{t('hire_title', language)}</h1>
                    <p className="text-sm text-slate-500 font-medium">{t('hire_subtitle', language)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onNavigate && onNavigate('chats_list')}
                        className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-100 text-slate-900 relative"
                    >
                        <MessageCircle size={20} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                    </motion.button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('hire_search', language)}
                    className="w-full bg-slate-50 h-12 pl-12 pr-4 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 ring-blue-200 transition-all"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 pb-32">
            {/* My Profile Card */}
            {myProfile ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-xl shadow-emerald-500/20 mb-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white/20 overflow-hidden">
                                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <UserIcon className="m-3 text-white"/>}
                            </div>
                            <div className="text-white">
                                <h3 className="font-bold">{language === 'ru' ? 'Мой профиль' : 'My Profile'}</h3>
                                <p className="text-xs text-white/80">{myProfile.role}</p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleEditProfile}
                            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white"
                        >
                            <Edit3 size={18} />
                        </motion.button>
                    </div>
                </motion.div>
            ) : (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsRegistering(true)}
                    className="w-full bg-white p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-blue-900/5 border border-blue-100 mb-6"
                >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Plus size={24} />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="text-base font-bold text-slate-900">
                            {language === 'ru' ? 'Добавить портфолио' : 'Add portfolio'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {language === 'ru' ? 'Получайте заказы' : 'Get orders'}
                        </p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300"/>
                </motion.button>
            )}

            {/* Categories Grid */}
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                {language === 'ru' ? 'Категории' : 'Categories'}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {categories.map((cat, idx) => {
                    const count = specialists.filter(s => s.categoryId === cat.id).length;
                    return (
                        <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCategory(cat.id)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left relative overflow-hidden group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                                <span className="text-xl">{cat.emoji}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm mb-0.5">{cat.title}</h3>
                            <p className="text-[10px] text-slate-400 font-medium">{count} {language === 'ru' ? 'спец.' : 'spec.'}</p>
                            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <ChevronRight size={14} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Top Specialists */}
            {specialists.length > 0 && (
                <>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                        {language === 'ru' ? 'Топ специалисты' : 'Top Specialists'}
                    </h3>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 mb-6">
                        {specialists.slice(0, 5).map((spec, idx) => (
                            <motion.div
                                key={spec.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => spec.id !== user?.id && handleChat(spec)}
                                className="shrink-0 w-36 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center cursor-pointer"
                            >
                                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden mx-auto mb-3 relative">
                                    {spec.avatar ? <img src={spec.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-4 text-slate-400" />}
                                    {spec.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>}
                                </div>
                                <h4 className="font-bold text-slate-900 text-xs truncate mb-0.5">{spec.name}</h4>
                                <p className="text-[10px] text-slate-500 truncate mb-1">{spec.role}</p>
                                <div className="flex items-center justify-center gap-1 text-amber-600">
                                    <Star size={10} className="fill-amber-500" />
                                    <span className="text-[10px] font-bold">{spec.rating}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}

            {/* Support Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white relative overflow-hidden"
            >
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                            <Sparkles size={16} className="text-yellow-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI HR</span>
                    </div>
                    <h3 className="text-base font-bold mb-1">{language === 'ru' ? 'Не нашли нужного?' : "Can't find the right one?"}</h3>
                    <p className="text-xs text-slate-400 mb-4">{language === 'ru' ? 'AI подберет за 15 минут' : 'AI will find in 15 min'}</p>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSupportChat}
                        className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg"
                    >
                        {language === 'ru' ? 'Создать заявку' : 'Create request'}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    </div>
  );
};
