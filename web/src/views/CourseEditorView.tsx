import React, { useState, useEffect, useRef } from 'react';
import { ViewProps, Course, CourseCategory, CourseDay, CourseLesson, CourseHomework } from '../types';
import { db, storage } from '../firebase';
import {
  ChevronLeft, Save, Plus, Trash2, Video, Image as ImageIcon,
  CheckCircle2, FileText, Zap, ChevronDown, ChevronUp, GripVertical,
  AlertCircle, FolderPlus, Calendar, Upload, X, Loader2, Play, Settings
} from 'lucide-react';
import { t } from '../services/translations';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Helper to generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const CourseEditorView: React.FC<ViewProps> = ({ user, onBack, language = 'ru' }) => {
  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    marketingHook: '',
    price: 2500,
    coverUrl: '',
    categories: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Navigation state (simplified: category > lessons, no day selection)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Compression state
  const [showCompressionModal, setShowCompressionModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingLessonInfo, setPendingLessonInfo] = useState<{categoryId: string, dayId: string, lessonId: string} | null>(null);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const MAX_FILE_SIZE_MB = 50; // Show compression warning above this size

  // Get current category and day
  const currentCategory = course.categories?.find(c => c.id === selectedCategoryId);
  const currentDay = currentCategory?.days?.find(d => d.id === selectedDayId);

  // === LOAD FFMPEG ===
  const loadFFmpeg = async () => {
    if (ffmpegRef.current || ffmpegLoaded) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress }) => {
      setCompressionProgress(Math.round(progress * 100));
    });

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      return ffmpeg;
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      return null;
    }
  };

  // === COMPRESS VIDEO ===
  const compressVideo = async (file: File, quality: 'light' | 'strong'): Promise<File | null> => {
    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      const ffmpeg = await loadFFmpeg();
      if (!ffmpeg) {
        alert('Не удалось загрузить компрессор. Попробуйте загрузить оригинал.');
        return null;
      }

      const inputName = 'input.mp4';
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Compression settings based on quality
      const crf = quality === 'light' ? '23' : '28'; // Lower = better quality, higher = more compression
      const preset = quality === 'light' ? 'fast' : 'medium';

      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', crf,
        '-preset', preset,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compressedBlob = new Blob([data as any], { type: 'video/mp4' });
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4', {
        type: 'video/mp4'
      });

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return compressedFile;
    } catch (err) {
      console.error('Compression error:', err);
      alert('Ошибка сжатия видео');
      return null;
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  // === HANDLE FILE SELECTION ===
  const handleFileSelect = (file: File, categoryId: string, dayId: string, lessonId: string) => {
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      // Show compression modal
      setPendingFile(file);
      setPendingLessonInfo({ categoryId, dayId, lessonId });
      setShowCompressionModal(true);
    } else {
      // Upload directly
      handleVideoUpload(file, categoryId, dayId, lessonId);
    }
  };

  // === HANDLE COMPRESSION CHOICE ===
  const handleCompressionChoice = async (choice: 'light' | 'strong' | 'original') => {
    if (!pendingFile || !pendingLessonInfo) return;

    setShowCompressionModal(false);

    if (choice === 'original') {
      handleVideoUpload(pendingFile, pendingLessonInfo.categoryId, pendingLessonInfo.dayId, pendingLessonInfo.lessonId);
    } else {
      const compressedFile = await compressVideo(pendingFile, choice);
      if (compressedFile) {
        handleVideoUpload(compressedFile, pendingLessonInfo.categoryId, pendingLessonInfo.dayId, pendingLessonInfo.lessonId);
      }
    }

    setPendingFile(null);
    setPendingLessonInfo(null);
  };

  // === SAVE COURSE ===
  const handleSave = async () => {
    if (!course.title || !user?.id) {
      setError("Название курса обязательно");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...course,
        authorId: user.id,
        authorName: user.name,
        updatedAt: new Date().toISOString(),
        createdAt: course.createdAt || new Date().toISOString(),
      };

      if (course.id) {
        await db.collection('courses').doc(course.id).update(payload);
      } else {
        await db.collection('courses').add(payload);
      }

      // Don't auto-close, let user decide
      // if (onBack) onBack();
      alert('Курс сохранен!');
    } catch (e) {
      console.error("Save error:", e);
      setError("Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  // Helper: ensure category has a default day (hidden from user)
  const ensureDefaultDay = (category: CourseCategory): CourseDay => {
    if (category.days && category.days.length > 0) return category.days[0];
    const defaultDay: CourseDay = {
      id: generateId(),
      title: 'default',
      order: 1,
      lessons: []
    };
    updateCategory(category.id, { days: [defaultDay] });
    return defaultDay;
  };

  // Select category and auto-open lessons (skip day selection)
  const selectCategory = (cat: CourseCategory) => {
    const day = cat.days?.[0];
    setSelectedCategoryId(cat.id);
    if (day) {
      setSelectedDayId(day.id);
    } else {
      // Create default day on first open
      const newDay: CourseDay = {
        id: generateId(),
        title: 'default',
        order: 1,
        lessons: []
      };
      updateCategory(cat.id, { days: [newDay] });
      setSelectedDayId(newDay.id);
    }
  };

  // === CATEGORY CRUD ===
  const addCategory = () => {
    const defaultDayId = generateId();
    const newCategory: CourseCategory = {
      id: generateId(),
      title: 'Новый раздел',
      order: (course.categories?.length || 0) + 1,
      days: [{ id: defaultDayId, title: 'default', order: 1, lessons: [] }]
    };
    setCourse(prev => ({
      ...prev,
      categories: [...(prev.categories || []), newCategory]
    }));
  };

  const updateCategory = (id: string, updates: Partial<CourseCategory>) => {
    setCourse(prev => ({
      ...prev,
      categories: prev.categories?.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCategory = (id: string) => {
    if (!window.confirm("Удалить категорию и все её содержимое?")) return;
    setCourse(prev => ({
      ...prev,
      categories: prev.categories?.filter(c => c.id !== id)
    }));
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
      setSelectedDayId(null);
    }
  };

  // === DAY CRUD ===
  const addDay = (categoryId: string) => {
    const category = course.categories?.find(c => c.id === categoryId);
    const newDay: CourseDay = {
      id: generateId(),
      title: 'Новый урок',
      order: (category?.days?.length || 0) + 1,
      lessons: []
    };
    updateCategory(categoryId, {
      days: [...(category?.days || []), newDay]
    });
    // Removed auto-selection: setSelectedDayId(newDay.id);
  };

  const updateDay = (categoryId: string, dayId: string, updates: Partial<CourseDay>) => {
    const category = course.categories?.find(c => c.id === categoryId);
    if (!category) return;
    updateCategory(categoryId, {
      days: category.days.map(d => d.id === dayId ? { ...d, ...updates } : d)
    });
  };

  const deleteDay = (categoryId: string, dayId: string) => {
    if (!window.confirm("Удалить день и все уроки?")) return;
    const category = course.categories?.find(c => c.id === categoryId);
    if (!category) return;
    updateCategory(categoryId, {
      days: category.days.filter(d => d.id !== dayId)
    });
    if (selectedDayId === dayId) setSelectedDayId(null);
  };

  // === LESSON CRUD ===
  const addLesson = (categoryId: string, dayId: string) => {
    const category = course.categories?.find(c => c.id === categoryId);
    const day = category?.days?.find(d => d.id === dayId);
    if (!day) return;

    const newLesson: CourseLesson = {
      id: generateId(),
      title: `Урок ${(day.lessons?.length || 0) + 1}`,
      videoUrl: '',
      order: (day.lessons?.length || 0) + 1
    };

    updateDay(categoryId, dayId, {
      lessons: [...(day.lessons || []), newLesson]
    });
  };

  const updateLesson = (categoryId: string, dayId: string, lessonId: string, updates: Partial<CourseLesson>) => {
    const category = course.categories?.find(c => c.id === categoryId);
    const day = category?.days?.find(d => d.id === dayId);
    if (!day) return;

    updateDay(categoryId, dayId, {
      lessons: day.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
    });
  };

  const deleteLesson = (categoryId: string, dayId: string, lessonId: string) => {
    const category = course.categories?.find(c => c.id === categoryId);
    const day = category?.days?.find(d => d.id === dayId);
    if (!day) return;

    updateDay(categoryId, dayId, {
      lessons: day.lessons.filter(l => l.id !== lessonId)
    });
  };

  // === VIDEO UPLOAD ===
  const handleVideoUpload = async (file: File, categoryId: string, dayId: string, lessonId: string) => {
    if (!file || !user?.id) return;

    setUploadingVideo(lessonId);
    setUploadProgress(0);

    try {
      const storagePath = `courses/${user.id}/${course.id || 'draft'}/${lessonId}/${file.name}`;
      const ref = storage.ref(storagePath);
      
      const uploadTask = ref.put(file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Ошибка загрузки видео');
          setUploadingVideo(null);
        },
        async () => {
          const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
          updateLesson(categoryId, dayId, lessonId, {
            videoUrl: downloadUrl,
            storagePath: storagePath
          });
          setUploadingVideo(null);
          setUploadProgress(0);
        }
      );
    } catch (e) {
      console.error('Upload error:', e);
      setError('Ошибка загрузки');
      setUploadingVideo(null);
    }
  };

  // === HOMEWORK ===
  const setDayHomework = (categoryId: string, dayId: string, homework: CourseHomework | undefined) => {
    updateDay(categoryId, dayId, { homework });
  };

  // === RENDER INFO TAB ===
  const renderInfoTab = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Hook */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Основная информация</h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Название курса</label>
          <input
            value={course.title}
            onChange={e => setCourse({ ...course, title: e.target.value })}
            className="w-full bg-slate-50 p-4 rounded-xl font-bold text-lg border border-slate-200 outline-none focus:border-slate-900 transition-colors"
            placeholder="Например: Таргет Pro"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Продающий заголовок</label>
          <textarea
            value={course.marketingHook}
            onChange={e => setCourse({ ...course, marketingHook: e.target.value })}
            className="w-full bg-slate-50 p-4 rounded-xl text-sm font-medium border border-slate-200 outline-none h-20 resize-none focus:border-slate-900 transition-colors"
            placeholder="Запусти рекламу за 3 дня и получи первых клиентов"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Описание</label>
          <textarea
            value={course.description}
            onChange={e => setCourse({ ...course, description: e.target.value })}
            className="w-full bg-slate-50 p-4 rounded-xl text-sm leading-relaxed border border-slate-200 outline-none h-32 resize-none focus:border-slate-900"
            placeholder="Полное описание курса..."
          />
        </div>
      </div>

      {/* Price & Cover */}
      <div className="flex gap-4">
        {/* Main Category */}
        <div className="w-1/3 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-2">Категория</label>
          <select
            value={course.mainCategory || ''}
            onChange={e => setCourse({ ...course, mainCategory: e.target.value })}
            className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm border border-slate-200 outline-none focus:border-slate-900"
          >
            <option value="">Без категории</option>
            <option value="Design">Дизайн</option>
            <option value="Marketing">Маркетинг</option>
            <option value="Programming">Программирование</option>
            <option value="Business">Бизнес</option>
            <option value="SMM">SMM</option>
            <option value="Language">Языки</option>
            <option value="Other">Другое</option>
          </select>
        </div>

        <div className="flex-1 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-2">Цена (⚡ кредиты)</label>
          <div className="relative">
            <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 fill-yellow-500" />
            <input
              type="number"
              value={course.price}
              onChange={e => setCourse({ ...course, price: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-50 pl-10 pr-4 py-4 rounded-xl font-black text-xl border border-slate-200 outline-none focus:border-slate-900"
              disabled={course.isFree}
            />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500">Бесплатный курс</span>
            <button
              onClick={() => setCourse({ ...course, isFree: !course.isFree, price: !course.isFree ? 0 : course.price })}
              className={`w-10 h-6 rounded-full relative transition-colors ${course.isFree ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${course.isFree ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-2">Обложка <span className="text-slate-400 font-normal ml-1">(16:9, 1920x1080)</span></label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file && user?.id) {
                const ref = storage.ref(`courses/${user.id}/covers/${generateId()}-${file.name}`);
                await ref.put(file);
                const url = await ref.getDownloadURL();
                setCourse({ ...course, coverUrl: url });
              }
            }}
          />
          {course.coverUrl ? (
            <div className="relative">
              <img src={course.coverUrl} className="w-full h-20 object-cover rounded-xl" />
              <button 
                onClick={() => setCourse({ ...course, coverUrl: '' })}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-slate-400 transition-colors"
            >
              <ImageIcon size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // === RENDER CONTENT TAB ===
  const renderContentTab = () => (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Sections List */}
      {!selectedCategoryId && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Разделы</h3>
            <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2 py-1 rounded-lg">
              {course.categories?.length || 0}
            </span>
          </div>

          <div className="space-y-3">
            {course.categories?.map((category) => {
              const lessonCount = category.days?.reduce((acc, d) => acc + (d.lessons?.length || 0), 0) || 0;
              return (
                <div
                  key={category.id}
                  onClick={() => selectCategory(category)}
                  className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <FolderPlus size={20} />
                  </div>
                  <div className="flex-1">
                    <input
                      value={category.title}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateCategory(category.id, { title: e.target.value })}
                      className="font-bold text-slate-900 bg-transparent outline-none w-full"
                    />
                    <p className="text-xs text-slate-400">{lessonCount} уроков</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={addCategory}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[20px] text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all active:scale-95"
          >
            <FolderPlus size={18} /> Добавить раздел
          </button>
        </>
      )}

      {/* Lessons inside Section (Category > default Day > Lessons) */}
      {selectedCategoryId && currentCategory && currentDay && (
        <>
          <button
            onClick={() => { setSelectedCategoryId(null); setSelectedDayId(null); }}
            className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-4 hover:text-slate-900"
          >
            <ChevronLeft size={16} /> Назад к разделам
          </button>

          <div className="bg-purple-50 p-4 rounded-[20px] border border-purple-100 mb-4">
            <input
              value={currentCategory.title}
              onChange={e => updateCategory(currentCategory.id, { title: e.target.value })}
              className="font-bold text-lg text-purple-900 bg-transparent outline-none w-full"
            />
          </div>

          {/* Lessons */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Уроки (видео)</h3>
          </div>

          <div className="space-y-3">
            {currentDay.lessons?.map((lesson) => (
              <div key={lesson.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                    <Video size={18} />
                  </div>
                  <input
                    value={lesson.title}
                    onChange={e => updateLesson(currentCategory.id, currentDay.id, lesson.id, { title: e.target.value })}
                    className="flex-1 font-bold text-slate-900 bg-transparent outline-none"
                    placeholder="Название урока"
                  />
                  <button 
                    onClick={() => deleteLesson(currentCategory.id, currentDay.id, lesson.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Video Upload/Preview */}
                {lesson.videoUrl ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-3">
                    <video src={lesson.videoUrl} className="w-full h-full object-contain" controls />
                    <button 
                      onClick={() => updateLesson(currentCategory.id, currentDay.id, lesson.id, { videoUrl: '', storagePath: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : uploadingVideo === lesson.id ? (
                  <div className="bg-slate-100 rounded-xl p-6 flex flex-col items-center justify-center aspect-video mb-3">
                    <Loader2 size={32} className="text-slate-400 animate-spin mb-2" />
                    <div className="w-full max-w-xs bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{Math.round(uploadProgress)}%</p>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file, currentCategory.id, currentDay.id, lesson.id);
                        }
                      }}
                    />
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center aspect-video mb-3 hover:border-green-400 hover:bg-green-50 transition-all">
                      <Upload size={32} className="text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400 font-bold">Загрузить видео</p>
                      <p className="text-[10px] text-slate-300 mt-1">Более {MAX_FILE_SIZE_MB}MB — предложим сжать</p>
                    </div>
                  </label>
                )}

                {/* YouTube URL (alternative to upload) */}
                {!lesson.videoUrl && (
                  <div className="mb-3">
                    <input
                      value={lesson.youtubeUrl || ''}
                      onChange={e => updateLesson(currentCategory.id, currentDay.id, lesson.id, { youtubeUrl: e.target.value })}
                      placeholder="Или вставьте YouTube ссылку"
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm border border-slate-200 outline-none"
                    />
                  </div>
                )}

                {/* Description */}
                <textarea
                  value={lesson.description || ''}
                  onChange={e => updateLesson(currentCategory.id, currentDay.id, lesson.id, { description: e.target.value })}
                  placeholder="Описание урока (опционально)"
                  className="w-full bg-slate-50 p-3 rounded-xl text-sm border border-slate-200 outline-none resize-none h-16"
                />

                {/* Free Preview Toggle */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Бесплатный превью</span>
                  <button
                    onClick={() => updateLesson(currentCategory.id, currentDay.id, lesson.id, { isFreePreview: !lesson.isFreePreview })}
                    className={`w-10 h-6 rounded-full relative transition-colors ${lesson.isFreePreview ? 'bg-green-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${lesson.isFreePreview ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addLesson(currentCategory.id, currentDay.id)}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[20px] text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all active:scale-95 mb-6"
          >
            <Video size={18} /> Добавить урок
          </button>

          {/* Homework Section */}
          <div className="bg-amber-50 p-4 rounded-[20px] border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-amber-600" />
              <h4 className="font-bold text-amber-900">Домашнее задание</h4>
            </div>

            {currentDay.homework ? (
              <div className="space-y-3">
                <input
                  value={currentDay.homework.title}
                  onChange={e => setDayHomework(currentCategory.id, currentDay.id, {
                    ...currentDay.homework!,
                    title: e.target.value
                  })}
                  placeholder="Название ДЗ"
                  className="w-full bg-white p-3 rounded-xl font-bold text-sm border border-amber-200 outline-none"
                />
                <textarea
                  value={currentDay.homework.description}
                  onChange={e => setDayHomework(currentCategory.id, currentDay.id, {
                    ...currentDay.homework!,
                    description: e.target.value
                  })}
                  placeholder="Описание задания..."
                  className="w-full bg-white p-3 rounded-xl text-sm border border-amber-200 outline-none resize-none h-24"
                />
                <button 
                  onClick={() => setDayHomework(currentCategory.id, currentDay.id, undefined)}
                  className="text-xs text-red-500 font-bold"
                >
                  Удалить ДЗ
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDayHomework(currentCategory.id, currentDay.id, {
                  id: generateId(),
                  title: 'Домашнее задание',
                  description: '',
                  type: 'text'
                })}
                className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-100 transition-all"
              >
                <Plus size={16} /> Добавить ДЗ
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden absolute inset-0 z-50 animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-16 pb-6 bg-white border-b border-slate-100 z-10 shrink-0 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 px-4 rounded-full bg-slate-900 text-white flex items-center justify-center active:scale-95 transition-transform hover:bg-slate-800 gap-2">
            <ChevronLeft size={16} /> <span className="text-xs font-bold">Мои курсы</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {course.id ? 'Редактирование' : 'Новый курс'}
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {loading ? 'Сохранение...' : 'Конструктор курсов'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="h-10 px-6 bg-slate-900 text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Сохранить</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'info' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100'}`}
        >
          <FileText size={14} /> Информация
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'content' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100'}`}
        >
          <Video size={14} /> Контент
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'content' && renderContentTab()}
      </div>

      {/* Compression Modal */}
      {showCompressionModal && pendingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Большой файл</h3>
                <p className="text-xs text-slate-400">
                  {(pendingFile.size / (1024 * 1024)).toFixed(1)} MB — рекомендуем сжать
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Видео больше {MAX_FILE_SIZE_MB}MB. Сжатие уменьшит размер и ускорит загрузку, качество останется хорошим.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleCompressionChoice('light')}
                className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-2xl text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                    <Settings size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Лёгкое сжатие</p>
                    <p className="text-xs text-green-600">~95% качества, размер ÷2-3</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleCompressionChoice('strong')}
                className="w-full p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">Сильное сжатие</p>
                    <p className="text-xs text-blue-600">~85% качества, размер ÷4-6</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleCompressionChoice('original')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-2xl text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-400 flex items-center justify-center">
                    <Upload size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Загрузить оригинал</p>
                    <p className="text-xs text-slate-500">Без сжатия, долгая загрузка</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowCompressionModal(false);
                setPendingFile(null);
                setPendingLessonInfo(null);
              }}
              className="w-full mt-4 py-3 text-slate-400 font-bold text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Compression Progress Overlay */}
      {isCompressing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center">
              <Loader2 size={36} className="text-white animate-spin" />
            </div>
            <h3 className="font-black text-xl text-slate-900 mb-2">Сжимаем видео...</h3>
            <p className="text-sm text-slate-500 mb-6">Это может занять пару минут</p>

            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                style={{ width: `${compressionProgress}%` }}
              />
            </div>
            <p className="text-2xl font-black text-slate-900">{compressionProgress}%</p>
          </div>
        </div>
      )}
    </div>
  );
};
