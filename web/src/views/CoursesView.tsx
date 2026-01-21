import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, PlayCircle, Lock, X, Clock, Star, Plus, Trash2, Video,
  Save, ChevronLeft, BookOpen, CheckCircle2, Send, FileText, Edit2,
  UserCheck, MessageSquare, ThumbsUp, ThumbsDown, LogIn, Zap,
  FolderOpen, Calendar, ChevronRight, StarIcon, Sparkles, TrendingUp,
  Layers, Users, Award, ArrowRight, Filter, Grid3X3, List
} from 'lucide-react';
import { db } from '../firebase';
import { Course, CourseCategory, CourseDay, CourseLesson, CourseRating, ViewProps } from '../types';
import { LoadingSpinner } from '../components/GlassComponents';
import { t } from '../services/translations';
import { motion, AnimatePresence } from 'framer-motion';

export const CoursesView: React.FC<ViewProps> = ({ user, onBuyCourse, onNavigate, onBack, onToggleTabBar, language = 'ru' }) => {
  const [viewState, setViewState] = useState<'list' | 'course_landing' | 'course_detail' | 'category_view' | 'day_view' | 'lesson_player' | 'rate_course'>('list');

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  const [selectedDay, setSelectedDay] = useState<CourseDay | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Homework State
  const [homeworkText, setHomeworkText] = useState('');
  const [homeworkSent, setHomeworkSent] = useState(false);

  // Rating State
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Reset Tab Bar when unmounting or returning to list
  useEffect(() => {
    if (onToggleTabBar) onToggleTabBar(true);
    return () => {
      if (onToggleTabBar) onToggleTabBar(true);
    };
  }, []);

  // Fetch Courses
  useEffect(() => {
    const unsubscribe = db.collection('courses').onSnapshot(snapshot => {
      if (snapshot.empty) {
        setCourses([]);
      } else {
        const fetchedCourses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];
        setCourses(fetchedCourses);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenEditor = (course?: Course) => {
    if (onNavigate) {
      onNavigate('course_editor', course || null);
    }
  };

  // --- NAVIGATION LOGIC ---
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    const isOwner = isUserOwner(course);
    const isPurchased = user?.purchasedCourseIds?.includes(course.id);

    if (onToggleTabBar) onToggleTabBar(false);

    if (isOwner || isPurchased) {
      setViewState('course_detail');
    } else {
      setViewState('course_landing');
    }
  };

  const handleCategoryClick = (category: CourseCategory) => {
    setSelectedCategory(category);
    setViewState('category_view');
  };

  const handleDayClick = (day: CourseDay) => {
    setSelectedDay(day);
    setViewState('day_view');
  };

  const handleLessonClick = (lesson: CourseLesson) => {
    setSelectedLesson(lesson);
    setViewState('lesson_player');
    setHomeworkText('');
    setHomeworkSent(false);
  };

  const handleInternalBack = () => {
    if (viewState === 'lesson_player') {
      setViewState('day_view');
      setSelectedLesson(null);
    } else if (viewState === 'day_view') {
      setViewState('category_view');
      setSelectedDay(null);
    } else if (viewState === 'category_view') {
      setViewState('course_detail');
      setSelectedCategory(null);
    } else if (viewState === 'rate_course') {
      setViewState('course_detail');
    } else if (viewState === 'course_detail' || viewState === 'course_landing') {
      setViewState('list');
      setSelectedCourse(null);
      setSelectedCategory(null);
      setSelectedDay(null);
      if (onToggleTabBar) onToggleTabBar(true);
    } else if (onBack) {
      if (onToggleTabBar) onToggleTabBar(true);
      onBack();
    }
  };

  const isUserOwner = (course: Course) => user && !user.isGuest && course.authorId === user.id;

  // Submit Rating
  const submitRating = async () => {
    if (!selectedCourse || !user) return;
    
    const newRating: CourseRating = {
      oderId: user.id,
      odername: user.name,
      oderavatar: user.avatar,
      rating: ratingValue,
      comment: ratingComment,
      createdAt: new Date().toISOString()
    };

    const existingRatings = selectedCourse.ratings || [];
    const updatedRatings = [...existingRatings.filter(r => r.oderId !== user.id), newRating];
    const avgRating = updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length;

    await db.collection('courses').doc(selectedCourse.id).update({
      ratings: updatedRatings,
      averageRating: avgRating
    });

    setRatingComment('');
    setViewState('course_detail');
  };

  // Calculate total lessons count
  const getTotalLessons = (course: Course) => {
    if (course.categories?.length) {
      return course.categories.reduce((sum, cat) => 
        sum + cat.days.reduce((daySum, day) => daySum + (day.lessons?.length || 0), 0), 0
      );
    }
    return course.lessons?.length || 0;
  };

  // --- 1. LANDING PAGE VIEW (SALES) ---
  if (viewState === 'course_landing' && selectedCourse) {
    return (
      <div className="flex flex-col h-full animate-fade-in bg-white relative overflow-y-auto no-scrollbar">
        <button onClick={handleInternalBack} className="fixed top-6 left-6 z-50 w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20 active:scale-95 transition-transform">
          <ChevronLeft size={22} className="text-slate-900" />
        </button>

        {/* Hero Section */}
        <div className="relative h-[65vh] w-full shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900">
            {selectedCourse.coverUrl && (
              <img src={selectedCourse.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-white"></div>
            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-600/30 rounded-full blur-[100px] animate-pulse"></div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-end p-8 pb-20 z-10">
            {selectedCourse.averageRating && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full self-start mb-4">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white">{selectedCourse.averageRating.toFixed(1)}</span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-4 tracking-tight drop-shadow-lg">
              {selectedCourse.title}
            </h1>
            <p className="text-lg text-white/90 font-medium leading-relaxed max-w-md drop-shadow-md">
              {selectedCourse.marketingHook || selectedCourse.description}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-10 -mt-10 relative z-20 bg-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
          <div className="mb-12">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-6">Содержание курса</h3>
            <div className="space-y-3">
              {selectedCourse.categories?.map((category, idx) => (
                <div key={category.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FolderOpen size={18} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{category.title}</h4>
                      <p className="text-xs text-slate-500">{category.days?.length || 0} дней</p>
                    </div>
                    <Lock size={14} className="text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky CTA Bar */}
        <div className="fixed bottom-0 left-0 w-full p-4 pb-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-40 flex items-center justify-between shadow-2xl animate-slide-up">
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none flex items-center gap-1">
              {(selectedCourse.price || 0).toLocaleString()} <Zap size={20} className="text-yellow-500 fill-yellow-500" />
            </p>
          </div>
          <button
            onClick={() => onBuyCourse && onBuyCourse(selectedCourse)}
            className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-bold text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center gap-2"
          >
            <span>Купить курс</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // --- 2. COURSE DASHBOARD (PURCHASED/OWNER) ---
  if (viewState === 'course_detail' && selectedCourse) {
    const isOwner = isUserOwner(selectedCourse);
    return (
      <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto bg-[#f2f4f6] relative">
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button onClick={handleInternalBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ChevronLeft size={20} className="text-slate-900" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 truncate pr-4">{selectedCourse.title}</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500 font-bold uppercase">Мой курс</p>
              {selectedCourse.averageRating && (
                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-full">
                  <Star size={10} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-bold text-yellow-700">{selectedCourse.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Creator Tools */}
        {isOwner && (
          <div className="flex gap-2 mb-6">
            <button onClick={() => handleOpenEditor(selectedCourse )} className="flex-1 bg-black text-white py-3 rounded-[20px] text-xs font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Edit2 size={14} /> Редактор
            </button>
          </div>
        )}

        {/* Rate Course Button (for purchased users) */}
        {!isOwner && (
          <button 
            onClick={() => setViewState('rate_course')}
            className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-[20px] text-xs font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Star size={14} /> Оставить отзыв
          </button>
        )}

        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-2">Категории</h3>

        <div className="space-y-3">
          {selectedCourse.categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="w-full bg-white p-4 rounded-[24px] flex items-center gap-4 text-left transition-all border border-slate-100 hover:shadow-md active:scale-[0.98] group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FolderOpen size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{category.title}</h4>
                <p className="text-xs text-slate-400">{category.days?.length || 0} дней</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600" />
            </button>
          ))}

          {(!selectedCourse.categories || selectedCourse.categories.length === 0) && (
            <div className="text-center py-12 text-slate-400">
              Курс пока пустой
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 3. CATEGORY VIEW ---
  if (viewState === 'category_view' && selectedCourse && selectedCategory) {
    return (
      <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto bg-[#f2f4f6]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleInternalBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ChevronLeft size={20} className="text-slate-900" />
          </button>
          <div>
            <p className="text-xs text-slate-500 font-bold">{selectedCourse.title}</p>
            <h2 className="text-xl font-extrabold text-slate-900">{selectedCategory.title}</h2>
          </div>
        </div>

        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-2">Дни</h3>

        <div className="space-y-3">
          {selectedCategory.days?.map((day) => (
            <button
              key={day.id}
              onClick={() => handleDayClick(day)}
              className="w-full bg-white p-4 rounded-[24px] flex items-center gap-4 text-left transition-all border border-slate-100 hover:shadow-md active:scale-[0.98] group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{day.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{day.lessons?.length || 0} уроков</span>
                  {day.homework && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">ДЗ</span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- 4. DAY VIEW (Lessons List) ---
  if (viewState === 'day_view' && selectedCourse && selectedCategory && selectedDay) {
    return (
      <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto bg-[#f2f4f6]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleInternalBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ChevronLeft size={20} className="text-slate-900" />
          </button>
          <div>
            <p className="text-xs text-slate-500 font-bold">{selectedCategory.title}</p>
            <h2 className="text-xl font-extrabold text-slate-900">{selectedDay.title}</h2>
          </div>
        </div>

        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-2">Уроки</h3>

        <div className="space-y-3 mb-6">
          {selectedDay.lessons?.map((lesson, idx) => (
            <button
              key={lesson.id}
              onClick={() => handleLessonClick(lesson)}
              className="w-full bg-white p-4 rounded-[24px] flex items-center gap-4 text-left transition-all border border-slate-100 hover:shadow-md active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{lesson.title}</h4>
                {lesson.duration && (
                  <div className="flex items-center gap-1">
                    <Clock size={10} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400">{lesson.duration}</span>
                  </div>
                )}
              </div>
              <PlayCircle size={24} className="text-slate-300 group-hover:text-green-500" />
            </button>
          ))}
        </div>

        {/* Homework Section */}
        {selectedDay.homework && (
          <div className="bg-amber-50 p-5 rounded-[24px] border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-amber-600" />
              <h4 className="font-bold text-amber-900">{selectedDay.homework.title}</h4>
            </div>
            <p className="text-sm text-amber-800 mb-4">{selectedDay.homework.description}</p>
            
            {!homeworkSent ? (
              <div className="space-y-3">
                <textarea
                  value={homeworkText}
                  onChange={(e) => setHomeworkText(e.target.value)}
                  placeholder="Ваш ответ..."
                  className="w-full h-24 bg-white border border-amber-200 rounded-xl p-3 text-sm focus:outline-none resize-none"
                />
                <button 
                  onClick={() => { if (homeworkText) setHomeworkSent(true); }} 
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${homeworkText ? 'bg-amber-600 text-white shadow-lg active:scale-95' : 'bg-amber-200 text-amber-400'}`}
                >
                  <Send size={16} /> Отправить
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 text-green-700 font-bold text-sm">
                <CheckCircle2 size={18} /> Отправлено!
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- 5. LESSON PLAYER ---
  if (viewState === 'lesson_player' && selectedLesson && selectedCourse) {
    return (
      <div className="flex flex-col h-full animate-fade-in relative z-50 bg-black text-white">
        {/* Helper for safe area background to prevent white notches */}
        <div className="absolute top-0 left-0 right-0 h-[50px] bg-black z-[-1]" />

        <div className="w-full aspect-video bg-black relative shadow-2xl shrink-0 pt-[env(safe-area-inset-top)]">
          <video src={selectedLesson.videoUrl} controls className="w-full h-full object-contain" autoPlay playsInline />
          <button onClick={handleInternalBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 z-50 active:scale-95 transition-transform hover:bg-white hover:text-black mt-[env(safe-area-inset-top)]">
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#0f1115] text-white rounded-t-[32px] -mt-6 relative z-10 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{selectedCourse.title}</span>
            <h1 className="text-2xl font-black text-white leading-tight mb-4">{selectedLesson.title}</h1>
            
            {selectedLesson.description ? (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm text-slate-300 leading-relaxed font-medium">{selectedLesson.description}</p>
              </div>
            ) : (
               <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 opacity-50">
                 <Video size={18} className="text-slate-500" />
                 <p className="text-xs text-slate-500 font-bold">Описание к этому уроку отсутствует. Наслаждайтесь просмотром!</p>
               </div>
            )}
          </div>

          {/* Navigation / Materials helper */}
          <div className="flex flex-col gap-3 pb-20">
             <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest px-1">Навигация</h3>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-4 group active:scale-[0.98]" onClick={handleInternalBack}>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1">
                   <h4 className="text-sm font-bold text-white mb-0.5">К списку уроков</h4>
                   <p className="text-xs text-slate-400">Материалы и домашнее задание</p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 6. RATE COURSE ---
  if (viewState === 'rate_course' && selectedCourse) {
    return (
      <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-32 overflow-y-auto bg-[#f2f4f6]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleInternalBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ChevronLeft size={20} className="text-slate-900" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Оставить отзыв</h2>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
          <p className="text-sm text-slate-600 mb-4">Оцените курс "{selectedCourse.title}"</p>
          
          <div className="flex gap-2 mb-6 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRatingValue(star)}>
                <Star 
                  size={32} 
                  className={`transition-colors ${star <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} 
                />
              </button>
            ))}
          </div>

          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Ваш комментарий (опционально)"
            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none resize-none mb-4"
          />

          <button 
            onClick={submitRating}
            className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Star size={16} /> Отправить отзыв
          </button>
        </div>

        {/* Existing Reviews */}
        {selectedCourse.ratings && selectedCourse.ratings.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Отзывы</h3>
            <div className="space-y-3">
              {selectedCourse.ratings.map((rating, idx) => (
                <div key={idx} className="bg-white p-4 rounded-[20px] border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {rating.odername?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900">{rating.odername}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= rating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {rating.comment && <p className="text-sm text-slate-600">{rating.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- CONSTANTS ---
  const ALL_CATEGORIES = [
    { id: 'Design', label: 'Дизайн', color: 'from-purple-500 to-violet-600', icon: Sparkles, emoji: '🎨' },
    { id: 'Marketing', label: 'Маркетинг', color: 'from-orange-500 to-red-500', icon: TrendingUp, emoji: '📈' },
    { id: 'Programming', label: 'Программирование', color: 'from-blue-500 to-cyan-500', icon: Layers, emoji: '💻' },
    { id: 'Business', label: 'Бизнес', color: 'from-emerald-500 to-teal-600', icon: Award, emoji: '💼' },
    { id: 'SMM', label: 'SMM', color: 'from-indigo-500 to-purple-600', icon: Users, emoji: '📱' },
    { id: 'Language', label: 'Языки', color: 'from-pink-500 to-rose-500', icon: MessageSquare, emoji: '🌍' },
    { id: 'Other', label: 'Другое', color: 'from-slate-500 to-slate-700', icon: FolderOpen, emoji: '📚' }
  ];

  // --- STATE ---
  const [showMyCoursesOnly, setShowMyCoursesOnly] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // --- 7. MAIN LIST VIEW ---
  // Get user's courses (purchased + owned)
  const myCourses = useMemo(() => {
    return courses.filter(c =>
      user?.purchasedCourseIds?.includes(c.id) || c.authorId === user?.id
    );
  }, [courses, user]);

  // Filter courses based on current filters
  const filteredCourses = useMemo(() => {
    let result = showMyCoursesOnly ? myCourses : courses;

    if (selectedCategoryFilter) {
      result = result.filter(c => c.mainCategory === selectedCategoryFilter);
    }

    return result;
  }, [courses, myCourses, showMyCoursesOnly, selectedCategoryFilter]);

  // Group courses by mainCategory
  const groupedCourses = useMemo(() => {
    const groups: Record<string, Course[]> = {};

    // Initialize all groups
    ALL_CATEGORIES.forEach(cat => {
      groups[cat.id] = [];
    });

    const coursesToGroup = showMyCoursesOnly ? myCourses : courses;

    coursesToGroup.forEach(course => {
      const category = course.mainCategory || 'Other';
      if (groups[category]) {
        groups[category].push(course);
      } else {
        groups['Other'].push(course);
      }
    });

    return groups;
  }, [courses, myCourses, showMyCoursesOnly]);


  // --- MY COURSES VIEW ---
  if (showMyCoursesOnly) {
    return (
      <div className="flex flex-col h-full animate-fade-in bg-[#f2f4f6] relative">
        {/* Header */}
        <div className="px-6 pt-16 pb-6 bg-white shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMyCoursesOnly(false)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
              >
                <ChevronLeft className="text-slate-900" size={22} />
              </motion.button>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{t('courses_my_courses', language)}</h2>
                <p className="text-sm text-slate-500">{myCourses.length} {t('courses_count', language)}</p>
              </div>
            </div>

            {!user?.isGuest && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenEditor()}
                className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg"
              >
                <Plus size={20} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
          {myCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap size={40} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('courses_empty_title', language)}</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-[250px] mx-auto">{t('courses_empty_desc', language)}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMyCoursesOnly(false)}
                className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm inline-flex items-center gap-2"
              >
                {t('courses_browse', language)} <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {myCourses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {renderMyCourseCard(course)}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN LIST VIEW ---
  return (
    <div className="flex flex-col h-full animate-fade-in bg-[#f2f4f6] relative">
      {/* Header */}
      <div className="px-6 pt-16 pb-4 bg-white shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="text-slate-900" size={22} />
            </motion.button>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{t('courses_title', language)}</h2>
              <p className="text-sm text-slate-500">{t('courses_subtitle', language)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMyCoursesOnly(true)}
              className="h-10 px-4 bg-slate-100 rounded-full font-bold text-xs flex items-center gap-2 text-slate-700"
            >
              <UserCheck size={16} />
              <span>{t('courses_my_courses', language)}</span>
            </motion.button>

            {!user?.isGuest && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenEditor()}
                className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg"
              >
                <Plus size={20} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Category Pills - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategoryFilter(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              !selectedCategoryFilter
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t('courses_all', language)}
          </motion.button>
          {ALL_CATEGORIES.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategoryFilter(cat.id === selectedCategoryFilter ? null : cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategoryFilter === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {selectedCategoryFilter ? t('courses_category_empty', language) : t('courses_empty_title', language)}
            </h3>
            <p className="text-sm text-slate-500">
              {selectedCategoryFilter ? t('courses_category_empty_desc', language) : t('courses_empty_desc', language)}
            </p>
          </motion.div>
        )}

        {/* When filtering by category - show flat list */}
        {!loading && selectedCategoryFilter && filteredCourses.length > 0 && (
          <div className="space-y-4">
            {filteredCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {renderCourseCard(course)}
              </motion.div>
            ))}
          </div>
        )}

        {/* When showing all - group by category */}
        {!loading && !selectedCategoryFilter && courses.length > 0 && (
          <div className="space-y-8">
            {ALL_CATEGORIES.map((category, catIdx) => {
              const categoryCourses = groupedCourses[category.id] || [];
              if (categoryCourses.length === 0) return null;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.1 }}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                        <span className="text-lg">{category.emoji}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{category.label}</h3>
                        <p className="text-xs text-slate-500">{categoryCourses.length} {t('courses_count', language)}</p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategoryFilter(category.id)}
                      className="text-xs font-bold text-slate-500 flex items-center gap-1"
                    >
                      {t('courses_view_all', language)} <ChevronRight size={14} />
                    </motion.button>
                  </div>

                  {/* Horizontal Scroll Courses */}
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
                    {categoryCourses.slice(0, 5).map((course, idx) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="shrink-0 w-[280px]"
                      >
                        {renderCompactCourseCard(course, category)}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Full-width course card for list view
  function renderCourseCard(course: Course) {
    const isPurchased = user?.purchasedCourseIds?.includes(course.id);
    const isOwner = isUserOwner(course);
    const totalLessons = getTotalLessons(course);

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCourseClick(course)}
        className="group relative h-56 overflow-hidden rounded-3xl cursor-pointer border border-white/50 shadow-xl"
      >
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isPurchased || isOwner ? "from-emerald-600 to-teal-800" : "from-slate-800 to-slate-900"}`}>
          {course.coverUrl && (
            <img src={course.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Owner Edit Button */}
        {isOwner && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); handleOpenEditor(course); }}
            className="absolute top-4 right-4 z-30 bg-white/20 backdrop-blur-md text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:text-black transition-colors"
          >
            <Edit2 size={16} />
          </motion.button>
        )}

        <div className="relative p-6 flex flex-col h-full justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                <Video size={10} /> {totalLessons} {t('courses_lessons', language)}
              </div>
              {course.averageRating && (
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-bold text-white">{course.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {!isPurchased && !isOwner && (
              <div className="bg-white text-slate-900 px-4 py-1.5 rounded-full font-bold text-xs shadow-lg">
                {course.price?.toLocaleString() || 0} ₸
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-black text-white leading-tight mb-2 line-clamp-2">{course.title}</h3>
            {course.marketingHook && (
              <p className="text-xs text-white/70 font-medium line-clamp-2 mb-4 max-w-[90%]">
                {course.marketingHook}
              </p>
            )}
            <div className={`inline-flex h-9 px-5 rounded-full items-center justify-center text-xs font-bold transition-all ${
              isPurchased || isOwner
                ? 'bg-white text-emerald-700'
                : 'bg-white/20 text-white backdrop-blur-md border border-white/20 group-hover:bg-white group-hover:text-slate-900'
            }`}>
              {isPurchased || isOwner ? t('courses_continue', language) : t('courses_start', language)}
              <ArrowRight size={14} className="ml-1.5" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact card for horizontal scroll
  function renderCompactCourseCard(course: Course, category: typeof ALL_CATEGORIES[0]) {
    const isPurchased = user?.purchasedCourseIds?.includes(course.id);
    const isOwner = isUserOwner(course);
    const totalLessons = getTotalLessons(course);

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCourseClick(course)}
        className="relative h-44 overflow-hidden rounded-2xl cursor-pointer border border-white/50 shadow-lg"
      >
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${category.color}`}>
          {course.coverUrl && (
            <img src={course.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        <div className="relative p-4 flex flex-col h-full justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-[9px] font-bold text-white">
              <Video size={8} /> {totalLessons}
            </div>
            {!isPurchased && !isOwner && (course.price || 0) > 0 && (
              <div className="bg-white text-slate-900 px-2 py-1 rounded-full font-bold text-[10px]">
                {(course.price || 0).toLocaleString()} ₸
              </div>
            )}
            {(isPurchased || isOwner) && (
              <div className="bg-emerald-500 text-white px-2 py-1 rounded-full font-bold text-[10px]">
                ✓
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1">{course.title}</h3>
            {course.averageRating && (
              <div className="flex items-center gap-1">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white/80">{course.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // My Courses card - detailed
  function renderMyCourseCard(course: Course) {
    const isOwner = isUserOwner(course);
    const totalLessons = getTotalLessons(course);
    const category = ALL_CATEGORIES.find(c => c.id === course.mainCategory) || ALL_CATEGORIES[6];

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCourseClick(course)}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 cursor-pointer"
      >
        {/* Thumbnail */}
        <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${category.color} shrink-0 overflow-hidden relative`}>
          {course.coverUrl ? (
            <img src={course.coverUrl} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">{category.emoji}</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 pr-2">{course.title}</h3>
            {isOwner && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleOpenEditor(course); }}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0"
              >
                <Edit2 size={12} className="text-slate-500" />
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-slate-500">{totalLessons} {t('courses_lessons', language)}</span>
            {course.averageRating && (
              <>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-bold text-slate-500">{course.averageRating.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
            isOwner ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isOwner ? t('courses_your_course', language) : t('courses_continue', language)}
          </div>
        </div>
      </motion.div>
    );
  }
};

