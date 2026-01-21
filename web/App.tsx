
import React, { useState } from 'react';
import { Home, GraduationCap, FileText, PenTool, Image as ImageIcon, User as UserIcon } from 'lucide-react';
import { ContractView } from './views/ContractView';
import { DesignView } from './views/DesignView';
import { PhotoView } from './views/PhotoView';
import { CoursesView } from './views/CoursesView';
import { ProfileView } from './views/ProfileView';
import { LoginView } from './views/LoginView';
import { HomeTabState, ViewState, User, Language } from './types';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Navigation State
  const [bottomTab, setBottomTab] = useState<ViewState>('home');
  const [homeTab, setHomeTab] = useState<HomeTabState>('photos');
  
  // Language State
  const [language, setLanguage] = useState<Language>('ru');

  // Liquid background blobs
  const Background = () => (
    <div className="liquid-bg">
      <div className="liquid-blob blob-1"></div>
      <div className="liquid-blob blob-2"></div>
      <div className="liquid-blob blob-3"></div>
    </div>
  );

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setBottomTab('home'); // Reset to home on login
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-slate-800 select-none font-sans bg-[#f0f2f5]">
      <Background />
      
      {/* Mobile Frame Container */}
      <div className="relative z-10 w-full h-full max-w-md mx-auto flex flex-col glass-panel md:rounded-[48px] md:my-8 md:h-[calc(100vh-64px)] md:shadow-2xl overflow-hidden transition-all duration-500 border border-white/40">
        
        {/* === LOGIC: SHOW LOGIN OR APP === */}
        {!user ? (
           <LoginView onLogin={handleLogin} />
        ) : (
          <>
            {/* === MAIN CONTENT === */}
            <div className="flex-1 relative overflow-hidden h-full flex flex-col pb-24">
              
              {/* TAB: HOME */}
              {bottomTab === 'home' && (
                <>
                  {/* Top Segmented Control (New Order: Photo, Design, Contract) */}
                  <div className="px-6 pt-8 pb-2 z-20 shrink-0">
                    <div className="bg-white/40 backdrop-blur-xl p-1.5 rounded-[20px] flex relative shadow-sm border border-white/50">
                      
                      {/* 1. Photo */}
                      <button onClick={() => setHomeTab('photos')} className={`flex-1 py-3 rounded-[16px] text-[12px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${homeTab === 'photos' ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>
                        <ImageIcon size={14} className={homeTab === 'photos' ? 'text-purple-600' : 'opacity-50'}/> <span>Фото</span>
                      </button>

                      {/* 2. Design */}
                      <button onClick={() => setHomeTab('design')} className={`flex-1 py-3 rounded-[16px] text-[12px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${homeTab === 'design' ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>
                        <PenTool size={14} className={homeTab === 'design' ? 'text-pink-600' : 'opacity-50'}/> <span>Дизайн</span>
                      </button>
                      
                      {/* 3. Contract */}
                      <button onClick={() => setHomeTab('contracts')} className={`flex-1 py-3 rounded-[16px] text-[12px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${homeTab === 'contracts' ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>
                        <FileText size={14} className={homeTab === 'contracts' ? 'text-blue-600' : 'opacity-50'}/> <span>Договор</span>
                      </button>

                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden relative">
                    {homeTab === 'photos' && <PhotoView />}
                    {homeTab === 'design' && <DesignView />}
                    {homeTab === 'contracts' && <ContractView />}
                  </div>
                </>
              )}

              {/* TAB: COURSES */}
              {bottomTab === 'courses' && (
                 <div className="flex-1 overflow-hidden relative pt-8">
                    <CoursesView />
                 </div>
              )}

              {/* TAB: PROFILE */}
              {bottomTab === 'profile' && (
                 <div className="flex-1 overflow-hidden relative pt-6">
                    <ProfileView 
                      user={user} 
                      onLogout={handleLogout} 
                      language={language}
                      setLanguage={setLanguage}
                    />
                 </div>
              )}

            </div>

            {/* === BOTTOM DOCK NAVIGATION === */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-30">
              <div className="glass-card rounded-[30px] p-2.5 flex justify-between items-center shadow-2xl border border-white/60 bg-white/70 backdrop-blur-[50px]">
                
                <button 
                  onClick={() => setBottomTab('home')}
                  className={`flex-1 h-14 flex flex-col items-center justify-center rounded-[24px] transition-all duration-300 ${bottomTab === 'home' ? 'bg-white shadow-lg scale-105' : 'hover:bg-white/30'}`}
                >
                  <Home size={22} className={`mb-0.5 ${bottomTab === 'home' ? 'text-blue-600 fill-blue-100' : 'text-slate-400'}`} />
                </button>

                <button 
                  onClick={() => setBottomTab('courses')}
                  className={`flex-1 h-14 flex flex-col items-center justify-center rounded-[24px] transition-all duration-300 ${bottomTab === 'courses' ? 'bg-white shadow-lg scale-105' : 'hover:bg-white/30'}`}
                >
                  <GraduationCap size={24} className={`mb-0.5 ${bottomTab === 'courses' ? 'text-purple-600 fill-purple-100' : 'text-slate-400'}`} />
                </button>

                <button 
                  onClick={() => setBottomTab('profile')}
                  className={`flex-1 h-14 flex flex-col items-center justify-center rounded-[24px] transition-all duration-300 ${bottomTab === 'profile' ? 'bg-white shadow-lg scale-105' : 'hover:bg-white/30'}`}
                >
                  <UserIcon size={22} className={`mb-0.5 ${bottomTab === 'profile' ? 'text-emerald-600 fill-emerald-100' : 'text-slate-400'}`} />
                </button>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default App;
