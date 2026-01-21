import React from 'react';
import { GraduationCap, BookOpen, PlayCircle, Lock } from 'lucide-react';

export const CoursesView: React.FC = () => {
  const courses = [
    {
      id: 1,
      title: "X5 Business Integration",
      description: "Интеграция X5 AI в бизнес-процессы.",
      duration: "2 часа",
      locked: false,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      id: 2,
      title: "Prompt Engineering Elite",
      description: "Продвинутые техники управления ИИ.",
      duration: "4.5 часа",
      locked: true,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      id: 3,
      title: "Legal Automation X5",
      description: "Автоматизация юридических процессов.",
      duration: "3 часа",
      locked: true,
      color: "text-slate-800",
      bg: "bg-slate-200"
    }
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in px-6 pt-4 pb-24 overflow-y-auto">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="p-4 rounded-2xl bg-slate-900 text-white mb-3 shadow-xl shadow-slate-900/20">
          <GraduationCap size={28} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">X5 Academy</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Elite Education</p>
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="glass-card p-5 rounded-3xl relative overflow-hidden group border border-white/60 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2.5 rounded-xl ${course.bg} ${course.color}`}>
                <BookOpen size={20} />
              </div>
              {course.locked ? (
                <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
                  <Lock size={16} />
                </div>
              ) : (
                <div className="bg-white p-2 rounded-xl text-slate-900 shadow-sm border border-slate-100">
                  <PlayCircle size={16} />
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{course.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4 font-medium">{course.description}</p>
            
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <span className="bg-white/40 px-3 py-1.5 rounded-lg border border-white/60">
                {course.duration}
              </span>
              {course.locked && <span className="flex items-center gap-1"><Lock size={10}/> X5 Pro Only</span>}
            </div>

            {!course.locked && (
               <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}
          </div>
        ))}
        
        <div className="p-6 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">More content coming soon</p>
        </div>
      </div>
    </div>
  );
};